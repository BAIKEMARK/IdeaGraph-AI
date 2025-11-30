import os
import json
import pickle
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
load_dotenv()  # Load from backend/.env
load_dotenv("../.env")  # Also try root .env

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Add request logging
@app.before_request
def log_request():
    print(f"[{request.method}] {request.path}")
    # Only log JSON body for POST requests with JSON content
    if request.is_json and request.json:
        print(f"Body: {str(request.json)[:200]}...")

@app.after_request
def log_response(response):
    print(f"Response: {response.status}")
    return response

# Vector Database Storage (use backend/data directory)
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
VECTOR_DB_PATH = DATA_DIR / "vector_db.pkl"
IDEAS_DB_PATH = DATA_DIR / "ideas_db.pkl"

# Get API configuration
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY") or LLM_API_KEY
EMBEDDING_BASE_URL = os.getenv("EMBEDDING_BASE_URL") or LLM_BASE_URL
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Check if API key is configured
if not LLM_API_KEY:
    print("=" * 60)
    print("⚠️  WARNING: LLM_API_KEY not configured!")
    print("=" * 60)
    print("Please create backend/.env or .env.local with your API key:")
    print("  LLM_API_KEY=your_api_key_here")
    print("  LLM_BASE_URL=https://api.openai.com/v1")
    print("=" * 60)

# Initialize OpenAI-compatible clients
llm_client = None
embedding_client = None

if LLM_API_KEY:
    llm_client = OpenAI(
        api_key=LLM_API_KEY,
        base_url=LLM_BASE_URL
    )
    
    embedding_client = OpenAI(
        api_key=EMBEDDING_API_KEY,
        base_url=EMBEDDING_BASE_URL
    )

# Valid entity and relation types
VALID_ENTITY_TYPES = {"Concept", "Tool", "Person", "Problem", "Solution", "Methodology", "Metric"}
VALID_RELATION_TYPES = {"solves", "causes", "contradicts", "consists_of", "depends_on", "enables", "disrupts", "powered_by", "relates_to"}

# Prompts
DISTILL_SYSTEM_PROMPT = """
---Role---
You are an expert Idea Distillation Specialist. Your goal is to transform messy user inputs into a structured "Idea Graph".

---Instructions---
1. **Core Distillation (The Root):**
    * Analyze the input text to identify the single, most central concept.
    * Generate a `one_liner`: A concise insight (max 20 words) capturing the essence.
    * Identify `tags`: 3-5 high-level thematic tags.

2. **Entity & Insight Extraction (The Nodes):**
    * Identify clearly defined entities, concepts, mental models, or key arguments.
    * **Entity Types**: [Concept, Tool, Person, Problem, Solution, Methodology, Metric].
    * **Description**: Provide a concise description strictly based on the input context.

3. **Relationship Extraction (The Edges):**
    * Identify how these entities connect to the `Core Idea` or to each other.
    * **Logic-First**: Prioritize logical relationships (e.g., "solves", "causes", "contradicts", "consists_of", "depends_on", "enables", "disrupts", "powered_by", "relates_to").

4. **Output Format:**
    * Return ONLY a valid JSON object. Do NOT include any markdown formatting or code blocks.
    * Use this exact structure:
    {
      "one_liner": "...",
      "tags": ["tag1", "tag2"],
      "summary": "...",
      "graph_structure": {
        "nodes": [
          {"id": "node1", "name": "Node Name", "type": "Concept", "desc": "Description"}
        ],
        "edges": [
          {"source": "node1", "target": "node2", "relation": "relates_to", "desc": "Optional description"}
        ]
      }
    }
    
IMPORTANT: Your response must be ONLY the JSON object, nothing else. No explanations, no markdown, just pure JSON.
"""

CHAT_SYSTEM_PROMPT = """
---Role---
You are an intelligent "Second Brain" partner. You are discussing specific ideas with the user.

---Goal---
Synthesize an answer based on the provided **Context** (Knowledge Graph + Document Chunks).
If the user's input significantly changes the idea, explicitly suggest an update action at the end of your response.

---Instructions---
1. **Language Matching:**
    * IMPORTANT: Always respond in the SAME LANGUAGE as the user's input.
    * If user writes in Chinese (中文), respond in Chinese.
    * If user writes in English, respond in English.
    * Match the user's language naturally and fluently.

2. **Answer Synthesis:**
    * Use `Knowledge Graph Data` for structure and relationships.
    * Use `Document Chunks` for details.
    * Citation style: Use [n] to cite source chunks.

3. **Action Triggers:**
    * If the user provides new information that contradicts or expands the context, ask: "Should I update the '[Idea Name]' with this new detail?" (or in user's language)
    * If the discussion spawns a totally new concept, ask: "This sounds like a new idea. Should I create a new card for '[New Concept]'?" (or in user's language)

---Context---
{context_data}
"""

SYSTEM_PROMPT_KEYWORDS = """
---Role---
You are a retrieval specialist for a personal knowledge base.

---Goal---
Extract keywords to find relevant notes and ideas in the user's database.

1. **High-Level Keywords**: Themes, abstract concepts (e.g., "Productivity Systems").
2. **Low-Level Keywords**: Specific entities, proper nouns (e.g., "Obsidian", "Project Alpha").

---Output Format---
JSON object with `high_level_keywords` and `low_level_keywords`.
"""

# ============ Validation Functions ============

def truncate_one_liner(text, max_words=20):
    """Truncate one-liner to max_words at word boundary"""
    words = text.split()
    if len(words) <= max_words:
        return text
    return ' '.join(words[:max_words])

def validate_and_fix_distilled_data(data):
    """
    Validate distilled data against schema and fix common issues.
    Returns (is_valid, fixed_data, errors)
    """
    errors = []
    fixed_data = data.copy()
    
    # Check required top-level fields
    required_fields = ['one_liner', 'tags', 'summary', 'graph_structure']
    for field in required_fields:
        if field not in fixed_data:
            errors.append(f"Missing required field: {field}")
            # Provide defaults
            if field == 'one_liner':
                fixed_data[field] = "Untitled idea"
            elif field == 'tags':
                fixed_data[field] = []
            elif field == 'summary':
                fixed_data[field] = ""
            elif field == 'graph_structure':
                fixed_data[field] = {"nodes": [], "edges": []}
    
    # Validate and fix one_liner length
    if 'one_liner' in fixed_data:
        original_one_liner = fixed_data['one_liner']
        fixed_data['one_liner'] = truncate_one_liner(original_one_liner, max_words=20)
        if fixed_data['one_liner'] != original_one_liner:
            print(f"⚠️  Truncated one_liner from {len(original_one_liner.split())} to 20 words")
    
    # Validate tags is a list
    if 'tags' in fixed_data and not isinstance(fixed_data['tags'], list):
        errors.append("tags must be a list")
        fixed_data['tags'] = []
    
    # Validate graph_structure
    if 'graph_structure' in fixed_data:
        graph = fixed_data['graph_structure']
        
        if not isinstance(graph, dict):
            errors.append("graph_structure must be an object")
            fixed_data['graph_structure'] = {"nodes": [], "edges": []}
        else:
            # Validate nodes
            if 'nodes' not in graph:
                errors.append("graph_structure missing 'nodes'")
                graph['nodes'] = []
            elif not isinstance(graph['nodes'], list):
                errors.append("graph_structure.nodes must be a list")
                graph['nodes'] = []
            else:
                # Validate each node
                valid_nodes = []
                for i, node in enumerate(graph['nodes']):
                    if not isinstance(node, dict):
                        errors.append(f"Node {i} is not an object")
                        continue
                    
                    # Check required node fields
                    node_errors = []
                    if 'id' not in node:
                        node_errors.append(f"Node {i} missing 'id'")
                    if 'name' not in node:
                        node_errors.append(f"Node {i} missing 'name'")
                    if 'type' not in node:
                        node_errors.append(f"Node {i} missing 'type'")
                    if 'desc' not in node:
                        node_errors.append(f"Node {i} missing 'desc'")
                    
                    # Validate entity type
                    if 'type' in node and node['type'] not in VALID_ENTITY_TYPES:
                        errors.append(f"Node {i} has invalid type '{node['type']}'. Valid types: {VALID_ENTITY_TYPES}")
                        # Try to fix common issues
                        if node['type'].lower() == 'concept':
                            node['type'] = 'Concept'
                        else:
                            node['type'] = 'Concept'  # Default to Concept
                    
                    if not node_errors:
                        valid_nodes.append(node)
                    else:
                        errors.extend(node_errors)
                
                graph['nodes'] = valid_nodes
            
            # Validate edges
            if 'edges' not in graph:
                errors.append("graph_structure missing 'edges'")
                graph['edges'] = []
            elif not isinstance(graph['edges'], list):
                errors.append("graph_structure.edges must be a list")
                graph['edges'] = []
            else:
                # Validate each edge
                valid_edges = []
                node_ids = {node['id'] for node in graph.get('nodes', []) if 'id' in node}
                
                for i, edge in enumerate(graph['edges']):
                    if not isinstance(edge, dict):
                        errors.append(f"Edge {i} is not an object")
                        continue
                    
                    # Check required edge fields
                    edge_errors = []
                    if 'source' not in edge:
                        edge_errors.append(f"Edge {i} missing 'source'")
                    elif edge['source'] not in node_ids:
                        edge_errors.append(f"Edge {i} source '{edge['source']}' references non-existent node")
                    
                    if 'target' not in edge:
                        edge_errors.append(f"Edge {i} missing 'target'")
                    elif edge['target'] not in node_ids:
                        edge_errors.append(f"Edge {i} target '{edge['target']}' references non-existent node")
                    
                    if 'relation' not in edge:
                        edge_errors.append(f"Edge {i} missing 'relation'")
                    elif edge['relation'] not in VALID_RELATION_TYPES:
                        errors.append(f"Edge {i} has invalid relation '{edge['relation']}'. Valid relations: {VALID_RELATION_TYPES}")
                        # Default to relates_to
                        edge['relation'] = 'relates_to'
                    
                    if not edge_errors:
                        valid_edges.append(edge)
                    else:
                        errors.extend(edge_errors)
                
                graph['edges'] = valid_edges
    
    is_valid = len(errors) == 0
    return is_valid, fixed_data, errors

# ============ Vector Database Functions ============

def load_vector_db():
    """Load vector database from disk"""
    if VECTOR_DB_PATH.exists() and IDEAS_DB_PATH.exists():
        with open(VECTOR_DB_PATH, 'rb') as f:
            vectors = pickle.load(f)
        with open(IDEAS_DB_PATH, 'rb') as f:
            ideas = pickle.load(f)
        return vectors, ideas
    return {}, {}

def save_vector_db(vectors, ideas):
    """Save vector database to disk"""
    with open(VECTOR_DB_PATH, 'wb') as f:
        pickle.dump(vectors, f)
    with open(IDEAS_DB_PATH, 'wb') as f:
        pickle.dump(ideas, f)

def add_to_vector_db(idea_id, embedding, idea_data):
    """Add an idea and its embedding to the vector database"""
    vectors, ideas = load_vector_db()
    vectors[idea_id] = np.array(embedding)
    ideas[idea_id] = idea_data
    save_vector_db(vectors, ideas)

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    # Calculate norms
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    # Handle zero vectors
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = np.dot(vec1, vec2) / (norm1 * norm2)
    
    # Clamp to [-1, 1] to handle floating point errors
    return float(np.clip(similarity, -1.0, 1.0))

def search_similar_ideas(query_embedding, top_k=3, exclude_id=None):
    """Search for similar ideas using cosine similarity"""
    try:
        vectors, ideas = load_vector_db()
        
        if not vectors:
            print("⚠️  Vector database is empty")
            return []
        
        query_vec = np.array(query_embedding)
        similarities = []
        
        for idea_id, vec in vectors.items():
            if idea_id == exclude_id:
                continue
            
            try:
                # Ensure vec is a numpy array
                vec = np.array(vec)
                
                # Check dimensions match
                if len(query_vec) != len(vec):
                    print(f"⚠️  Dimension mismatch for idea {idea_id}: query={len(query_vec)}, stored={len(vec)}")
                    continue
                
                sim = cosine_similarity(query_vec, vec)
                
                # Get idea data, handle missing ideas
                if idea_id in ideas:
                    similarities.append((idea_id, sim, ideas[idea_id]))
                else:
                    print(f"⚠️  Idea {idea_id} has vector but no data")
                    
            except Exception as e:
                print(f"⚠️  Error calculating similarity for idea {idea_id}: {e}")
                continue
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
        
    except Exception as e:
        print(f"❌ Error in search_similar_ideas: {e}")
        import traceback
        print(traceback.format_exc())
        return []

def traverse_graph(idea_data, max_depth=1):
    """Traverse the graph structure to find related concepts"""
    graph = idea_data.get('distilled_data', {}).get('graph_structure', {})
    nodes = graph.get('nodes', [])
    edges = graph.get('edges', [])
    
    # Extract key concepts and relationships
    concepts = [node['name'] for node in nodes]
    relations = [f"{edge['source']} {edge['relation']} {edge['target']}" for edge in edges]
    
    return {
        'concepts': concepts,
        'relations': relations
    }


@app.route("/api/distill", methods=["POST"])
def distill():
    """Distill raw text into structured idea data using OpenAI-compatible API"""
    import time
    start_time = time.time()
    
    try:
        if not llm_client or not embedding_client:
            return jsonify({"error": "API not configured. Please set LLM_API_KEY in backend/.env"}), 500
        
        data = request.json
        text = data.get("text", "")
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        print(f"⏱️  Distilling text: {text[:100]}...")
        
        # 调用 LLM API
        llm_start = time.time()
        
        # 构建请求参数（某些模型不支持 response_format）
        request_params = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": DISTILL_SYSTEM_PROMPT},
                {"role": "user", "content": f"Distill this idea:\n\n{text}"}
            ],
            "temperature": 0.7
        }
        
        # 只有 OpenAI 和部分兼容模型支持 response_format
        # DeepSeek 等模型可能不支持，所以我们在提示词中明确要求 JSON
        try:
            request_params["response_format"] = {"type": "json_object"}
            response = llm_client.chat.completions.create(**request_params)
        except Exception as e:
            print(f"⚠️  response_format 不支持，使用普通模式: {e}")
            del request_params["response_format"]
            response = llm_client.chat.completions.create(**request_params)
        
        llm_time = time.time() - llm_start
        print(f"   LLM call: {llm_time:.2f}s")
        
        result_text = response.choices[0].message.content
        
        # 调试：打印 LLM 返回的原始内容
        print(f"   LLM raw response: {result_text[:200]}...")
        
        # 尝试解析 JSON
        try:
            distilled = json.loads(result_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失败: {e}")
            print(f"   原始响应: {result_text}")
            # 尝试提取 JSON（有些模型会在 markdown 代码块中返回 JSON）
            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
                print(f"   提取的 JSON: {result_text[:200]}...")
                distilled = json.loads(result_text)
            elif "```" in result_text:
                json_start = result_text.find("```") + 3
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
                print(f"   提取的 JSON: {result_text[:200]}...")
                distilled = json.loads(result_text)
            else:
                raise
        
        # 验证并修复蒸馏数据
        validation_start = time.time()
        is_valid, fixed_distilled, validation_errors = validate_and_fix_distilled_data(distilled)
        validation_time = time.time() - validation_start
        
        if validation_errors:
            print(f"⚠️  Validation issues found ({len(validation_errors)}): {validation_errors[:3]}")
            print(f"   Validation & fix: {validation_time:.3f}s")
        else:
            print(f"✅ Schema validation passed: {validation_time:.3f}s")
        
        # Use fixed data
        distilled = fixed_distilled
        
        # Generate embedding for the idea
        emb_start = time.time()
        embedding_response = embedding_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text
        )
        embedding_vector = embedding_response.data[0].embedding
        emb_time = time.time() - emb_start
        print(f"   Embedding call: {emb_time:.2f}s")
        
        # Add embedding to response
        distilled["embedding_vector"] = embedding_vector
        
        total_time = time.time() - start_time
        print(f"✅ Total distill time: {total_time:.2f}s")
        
        return jsonify(distilled)
    
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse LLM response: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/save_idea", methods=["POST"])
def save_idea():
    """Save an idea to the vector database"""
    import time
    start_time = time.time()
    
    try:
        data = request.json
        idea_id = data.get("idea_id")
        embedding = data.get("embedding_vector")
        idea_data = data.get("idea_data")
        
        if not idea_id or not embedding or not idea_data:
            return jsonify({"error": "Missing required fields"}), 400
        
        print(f"💾 Saving idea {idea_id[:8]}...")
        
        db_start = time.time()
        add_to_vector_db(idea_id, embedding, idea_data)
        db_time = time.time() - db_start
        
        total_time = time.time() - start_time
        print(f"   DB write: {db_time:.3f}s")
        print(f"✅ Total save time: {total_time:.3f}s")
        
        return jsonify({"status": "success", "idea_id": idea_id})
    
    except Exception as e:
        print(f"❌ Save failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/search_similar", methods=["POST"])
def search_similar():
    """Search for similar ideas using vector similarity"""
    import time
    import traceback
    start_time = time.time()
    
    try:
        data = request.json
        query_embedding = data.get("query_embedding")
        top_k = data.get("top_k", 3)
        exclude_id = data.get("exclude_id")
        
        if not query_embedding:
            return jsonify({"error": "No query embedding provided"}), 400
        
        search_start = time.time()
        similar_ideas = search_similar_ideas(query_embedding, top_k, exclude_id)
        search_time = time.time() - search_start
        
        results = [
            {
                "idea_id": idea_id,
                "similarity": float(sim),
                "idea_data": idea_data
            }
            for idea_id, sim, idea_data in similar_ideas
        ]
        
        total_time = time.time() - start_time
        print(f"🔍 Search similar: {search_time:.3f}s (found {len(results)} ideas)")
        
        return jsonify({"results": results})
    
    except Exception as e:
        print(f"❌ Search similar error: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500


def build_rag_context(current_idea, current_embedding, current_id, selected_idea_ids=None):
    """
    Build comprehensive RAG context including:
    - Knowledge Graph Data (structure and relationships)
    - Document Chunks (detailed content)
    - Similar ideas from vector search
    
    Returns: (context_string, citations_list)
    """
    citations = []
    citation_idx = 1
    
    # Start with current idea as primary context
    distilled = current_idea.get('distilled_data', {})
    idea_name = distilled.get('one_liner', 'Current Idea')
    
    context_parts = []
    context_parts.append("=== PRIMARY IDEA ===")
    context_parts.append(f"Title: {idea_name}")
    context_parts.append(f"Tags: {', '.join(distilled.get('tags', []))}")
    context_parts.append(f"Summary: {distilled.get('summary', 'N/A')}")
    
    # Add citation for current idea
    citations.append({
        "index": citation_idx,
        "idea_id": current_id,
        "idea_name": idea_name,
        "snippet": distilled.get('summary', '')[:200]
    })
    context_parts.append(f"[{citation_idx}]")
    citation_idx += 1
    
    # Add Knowledge Graph Data (structure)
    graph_structure = distilled.get('graph_structure', {})
    nodes = graph_structure.get('nodes', [])
    edges = graph_structure.get('edges', [])
    
    if nodes:
        context_parts.append("\n=== KNOWLEDGE GRAPH STRUCTURE ===")
        context_parts.append("Entities:")
        for node in nodes[:10]:  # Limit to first 10 nodes
            context_parts.append(f"  - {node.get('name', 'N/A')} ({node.get('type', 'N/A')}): {node.get('desc', 'N/A')}")
    
    if edges:
        context_parts.append("\nRelationships:")
        for edge in edges[:10]:  # Limit to first 10 edges
            relation_desc = f"  - {edge.get('source', 'N/A')} --[{edge.get('relation', 'N/A')}]--> {edge.get('target', 'N/A')}"
            if edge.get('desc'):
                relation_desc += f": {edge['desc']}"
            context_parts.append(relation_desc)
    
    # Add Document Chunks from raw content
    raw_content = current_idea.get('content_raw', '')
    if raw_content:
        context_parts.append("\n=== DOCUMENT CONTENT ===")
        # Split into chunks (simple approach - split by paragraphs)
        chunks = [c.strip() for c in raw_content.split('\n\n') if c.strip()]
        for chunk in chunks[:3]:  # Limit to first 3 chunks
            context_parts.append(f"[{citation_idx}] {chunk[:300]}...")
            citations.append({
                "index": citation_idx,
                "idea_id": current_id,
                "idea_name": idea_name,
                "snippet": chunk[:200]
            })
            citation_idx += 1
    
    # Add selected ideas if provided (multi-idea context)
    if selected_idea_ids and len(selected_idea_ids) > 1:
        vectors, ideas = load_vector_db()
        context_parts.append("\n=== SELECTED IDEAS IN CONTEXT ===")
        
        for sel_id in selected_idea_ids:
            if sel_id == current_id:
                continue  # Skip current idea, already added
            
            if sel_id in ideas:
                sel_idea = ideas[sel_id]
                sel_distilled = sel_idea.get('distilled_data', {})
                sel_name = sel_distilled.get('one_liner', 'Untitled')
                
                context_parts.append(f"\nIdea: {sel_name}")
                context_parts.append(f"Tags: {', '.join(sel_distilled.get('tags', []))}")
                context_parts.append(f"Summary: {sel_distilled.get('summary', 'N/A')}")
                context_parts.append(f"[{citation_idx}]")
                
                citations.append({
                    "index": citation_idx,
                    "idea_id": sel_id,
                    "idea_name": sel_name,
                    "snippet": sel_distilled.get('summary', '')[:200]
                })
                citation_idx += 1
    
    # RAG: Search for similar ideas using vector similarity
    if current_embedding:
        similar_ideas = search_similar_ideas(current_embedding, top_k=3, exclude_id=current_id)
        
        if similar_ideas:
            context_parts.append("\n=== RELATED IDEAS (Vector Search) ===")
            for idea_id, sim, idea_data in similar_ideas:
                sim_distilled = idea_data.get('distilled_data', {})
                sim_name = sim_distilled.get('one_liner', 'Untitled')
                
                context_parts.append(f"\n[{citation_idx}] {sim_name} (similarity: {sim:.2f})")
                context_parts.append(f"Tags: {', '.join(sim_distilled.get('tags', []))}")
                context_parts.append(f"Summary: {sim_distilled.get('summary', 'N/A')[:200]}...")
                
                citations.append({
                    "index": citation_idx,
                    "idea_id": idea_id,
                    "idea_name": sim_name,
                    "snippet": sim_distilled.get('summary', '')[:200]
                })
                citation_idx += 1
    
    context_string = "\n".join(context_parts)
    return context_string, citations


def detect_evolution_opportunity(user_message, response_text, current_idea):
    """
    Detect if the conversation suggests an evolution opportunity.
    Returns: dict with type ('refine', 'create_new', None) and suggestion message
    """
    # Simple keyword-based detection (can be enhanced with LLM analysis)
    user_lower = user_message.lower()
    response_lower = response_text.lower()
    
    # Check for refinement triggers
    refinement_keywords = ['update', 'change', 'modify', 'add', 'include', 'expand', 'correct']
    if any(keyword in user_lower for keyword in refinement_keywords):
        if len(user_message.split()) > 10:  # Substantial new information
            idea_name = current_idea.get('distilled_data', {}).get('one_liner', 'this idea')
            return {
                'type': 'refine',
                'message': f"Should I update '{idea_name}' with this new detail?",
                'affected_idea_ids': [current_idea.get('idea_id')]
            }
    
    # Check for new concept triggers
    new_concept_keywords = ['new idea', 'another thought', 'separate concept', 'different topic']
    if any(keyword in user_lower for keyword in new_concept_keywords):
        return {
            'type': 'create_new',
            'message': "This sounds like a new idea. Should I create a new card for it?",
            'affected_idea_ids': []
        }
    
    # Check if response suggests updates
    if 'should i update' in response_lower or 'should i create' in response_lower:
        # Response already contains suggestion
        return {
            'type': 'suggested_in_response',
            'message': None,
            'affected_idea_ids': [current_idea.get('idea_id')]
        }
    
    return None


@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat about an idea using OpenAI-compatible API with enhanced RAG"""
    import time
    start_time = time.time()
    
    try:
        if not llm_client:
            return jsonify({"error": "API not configured. Please set LLM_API_KEY in backend/.env"}), 500
        
        data = request.json
        history = data.get("history", [])
        # 兼容两种命名方式
        current_idea = data.get("currentIdea") or data.get("current_idea", {})
        selected_idea_ids = data.get("selected_idea_ids", [current_idea.get("idea_id")])
        
        # Get current idea embedding for similarity search
        current_embedding = current_idea.get("embedding_vector")
        current_id = current_idea.get("idea_id")
        
        # Build comprehensive RAG context
        rag_start = time.time()
        context_data, citations = build_rag_context(
            current_idea, 
            current_embedding, 
            current_id,
            selected_idea_ids
        )
        rag_time = time.time() - rag_start
        print(f"⏱️  RAG context building: {rag_time:.3f}s ({len(citations)} citations)")
        
        # Format system prompt with context
        system_prompt = CHAT_SYSTEM_PROMPT.replace("{context_data}", context_data)
        
        # Convert history to OpenAI format
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        for msg in history:
            role = "assistant" if msg["role"] == "model" else msg["role"]
            messages.append({"role": role, "content": msg["text"]})
        
        # Call LLM API
        llm_start = time.time()
        response = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.8
        )
        llm_time = time.time() - llm_start
        print(f"   LLM call: {llm_time:.2f}s")
        
        reply = response.choices[0].message.content
        
        # Detect evolution opportunities
        user_message = history[-1]["text"] if history else ""
        evolution_suggestion = detect_evolution_opportunity(user_message, reply, current_idea)
        
        total_time = time.time() - start_time
        print(f"✅ Total chat time: {total_time:.2f}s")
        
        response_data = {
            "text": reply,
            "citations": citations
        }
        
        if evolution_suggestion:
            response_data["evolution_suggestion"] = evolution_suggestion
            print(f"   💡 Evolution opportunity detected: {evolution_suggestion['type']}")
        
        return jsonify(response_data)
    
    except Exception as e:
        import traceback
        print(f"❌ Chat error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/api/get_all_ideas", methods=["GET"])
def get_all_ideas():
    """Get all ideas from the vector database"""
    try:
        vectors, ideas = load_vector_db()
        
        # Convert ideas dict to list and sort by created_at (newest first)
        ideas_list = list(ideas.values())
        ideas_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({"ideas": ideas_list})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/delete_idea", methods=["POST"])
def delete_idea():
    """
    Delete an idea from the vector database
    
    Request body:
    {
        "idea_id": "uuid"
    }
    
    Returns:
    {
        "status": "success",
        "deleted_id": "uuid"
    }
    """
    import time
    start_time = time.time()
    
    try:
        data = request.json
        idea_id = data.get("idea_id")
        
        if not idea_id:
            return jsonify({"error": "No idea_id provided"}), 400
        
        print(f"🗑️  Deleting idea: {idea_id[:8]}...")
        
        # Load current database
        vectors, ideas = load_vector_db()
        
        # Check if idea exists
        if idea_id not in ideas:
            return jsonify({"error": f"Idea not found: {idea_id}"}), 404
        
        # Remove from both dictionaries
        if idea_id in vectors:
            del vectors[idea_id]
        if idea_id in ideas:
            del ideas[idea_id]
        
        # Save updated database
        save_vector_db(vectors, ideas)
        
        total_time = time.time() - start_time
        print(f"✅ Idea deleted in {total_time:.3f}s")
        
        return jsonify({
            "status": "success",
            "deleted_id": idea_id
        })
    
    except Exception as e:
        import traceback
        print(f"❌ Delete failed: {e}")
        print(traceback.format_exc())
        return jsonify({"error": f"Delete operation failed: {str(e)}"}), 500


@app.route("/api/delete_ideas_batch", methods=["POST"])
def delete_ideas_batch():
    """
    Delete multiple ideas from the vector database in batch
    
    Request body:
    {
        "idea_ids": ["uuid1", "uuid2", ...]
    }
    
    Returns:
    {
        "status": "success",
        "deleted_count": 3,
        "deleted_ids": ["uuid1", "uuid2", ...],
        "not_found_ids": ["uuid3", ...]
    }
    """
    import time
    start_time = time.time()
    
    try:
        data = request.json
        idea_ids = data.get("idea_ids", [])
        
        if not idea_ids:
            return jsonify({"error": "No idea_ids provided"}), 400
        
        if not isinstance(idea_ids, list):
            return jsonify({"error": "idea_ids must be a list"}), 400
        
        print(f"🗑️  Batch deleting {len(idea_ids)} ideas...")
        
        # Load current database
        vectors, ideas = load_vector_db()
        
        deleted_ids = []
        not_found_ids = []
        
        # Process each idea
        for idea_id in idea_ids:
            if idea_id in ideas:
                # Remove from both dictionaries
                if idea_id in vectors:
                    del vectors[idea_id]
                if idea_id in ideas:
                    del ideas[idea_id]
                deleted_ids.append(idea_id)
                print(f"   ✓ Deleted: {idea_id[:8]}...")
            else:
                not_found_ids.append(idea_id)
                print(f"   ⚠️  Not found: {idea_id[:8]}...")
        
        # Save updated database once
        if deleted_ids:
            save_vector_db(vectors, ideas)
        
        total_time = time.time() - start_time
        print(f"✅ Batch delete completed in {total_time:.3f}s")
        print(f"   Deleted: {len(deleted_ids)}, Not found: {len(not_found_ids)}")
        
        return jsonify({
            "status": "success",
            "deleted_count": len(deleted_ids),
            "deleted_ids": deleted_ids,
            "not_found_ids": not_found_ids
        })
    
    except Exception as e:
        import traceback
        print(f"❌ Batch delete failed: {e}")
        print(traceback.format_exc())
        return jsonify({"error": f"Batch delete operation failed: {str(e)}"}), 500


@app.route("/api/clear_chat_history", methods=["POST"])
def clear_chat_history():
    """
    Clear chat history for a specific idea
    
    Request body:
    {
        "idea_id": "uuid"
    }
    
    Returns:
    {
        "status": "success",
        "idea_id": "uuid"
    }
    """
    try:
        data = request.json
        idea_id = data.get("idea_id")
        
        if not idea_id:
            return jsonify({"error": "No idea_id provided"}), 400
        
        print(f"🧹 Clearing chat history for idea: {idea_id[:8]}...")
        
        # Load current database
        vectors, ideas = load_vector_db()
        
        # Check if idea exists
        if idea_id not in ideas:
            return jsonify({"error": f"Idea not found: {idea_id}"}), 404
        
        # Clear chat history
        idea = ideas[idea_id]
        if 'chat_history' in idea:
            del idea['chat_history']
        
        # Save updated database
        save_vector_db(vectors, ideas)
        
        print(f"✅ Chat history cleared for {idea_id[:8]}")
        
        return jsonify({
            "status": "success",
            "idea_id": idea_id
        })
    
    except Exception as e:
        import traceback
        print(f"❌ Clear chat history failed: {e}")
        print(traceback.format_exc())
        return jsonify({"error": f"Clear operation failed: {str(e)}"}), 500


@app.route("/api/extract_keywords", methods=["POST"])
def extract_keywords():
    """
    Extract high-level and low-level keywords from a query for enhanced retrieval.
    
    Request body:
    {
        "query": "search query text"
    }
    
    Returns:
    {
        "high_level_keywords": ["theme1", "concept1"],
        "low_level_keywords": ["entity1", "proper_noun1"]
    }
    """
    import time
    start_time = time.time()
    
    try:
        if not llm_client:
            return jsonify({"error": "API not configured. Please set LLM_API_KEY in backend/.env"}), 500
        
        data = request.json
        query = data.get("query", "")
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        print(f"🔑 Extracting keywords from: {query[:100]}...")
        
        # Call LLM API for keyword extraction
        llm_start = time.time()
        
        request_params = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_KEYWORDS},
                {"role": "user", "content": f"Extract keywords from this query:\n\n{query}"}
            ],
            "temperature": 0.3
        }
        
        # Try with JSON response format
        try:
            request_params["response_format"] = {"type": "json_object"}
            response = llm_client.chat.completions.create(**request_params)
        except Exception as e:
            print(f"⚠️  response_format not supported, using normal mode: {e}")
            del request_params["response_format"]
            response = llm_client.chat.completions.create(**request_params)
        
        llm_time = time.time() - llm_start
        print(f"   LLM call: {llm_time:.2f}s")
        
        result_text = response.choices[0].message.content
        
        # Parse JSON response
        try:
            keywords = json.loads(result_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
                keywords = json.loads(result_text)
            elif "```" in result_text:
                json_start = result_text.find("```") + 3
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
                keywords = json.loads(result_text)
            else:
                raise
        
        # Validate structure
        if "high_level_keywords" not in keywords:
            keywords["high_level_keywords"] = []
        if "low_level_keywords" not in keywords:
            keywords["low_level_keywords"] = []
        
        total_time = time.time() - start_time
        print(f"✅ Keyword extraction: {total_time:.2f}s")
        print(f"   High-level: {keywords['high_level_keywords']}")
        print(f"   Low-level: {keywords['low_level_keywords']}")
        
        return jsonify(keywords)
    
    except Exception as e:
        import traceback
        print(f"❌ Keyword extraction error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok" if llm_client else "not_configured",
        "api_configured": llm_client is not None,
        "llm_model": LLM_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "llm_base_url": LLM_BASE_URL,
        "embedding_base_url": EMBEDDING_BASE_URL,
        "vector_db_exists": VECTOR_DB_PATH.exists(),
        "ideas_count": len(load_vector_db()[0]) if VECTOR_DB_PATH.exists() else 0
    })


# ============ Evolution Command Endpoints ============

from evolution_processor import EvolutionProcessor

# Initialize evolution processor
evolution_processor = None
if llm_client and embedding_client:
    evolution_processor = EvolutionProcessor(
        llm_client=llm_client,
        embedding_client=embedding_client,
        llm_model=LLM_MODEL,
        embedding_model=EMBEDDING_MODEL
    )


@app.route("/api/merge_ideas", methods=["POST"])
def merge_ideas():
    """
    Merge multiple ideas into a synthesized concept.
    
    Request body:
    {
        "idea_ids": ["id1", "id2", ...]
    }
    
    Returns:
    {
        "merged_idea": {...},
        "status": "success"
    }
    """
    import time
    import traceback
    start_time = time.time()
    
    try:
        if not evolution_processor:
            return jsonify({"error": "Evolution processor not configured. Please set LLM_API_KEY"}), 500
        
        data = request.json
        idea_ids = data.get("idea_ids", [])
        
        # Validation
        if not idea_ids:
            return jsonify({"error": "No idea_ids provided"}), 400
        
        if len(idea_ids) < 2:
            return jsonify({"error": "At least 2 ideas required for merge"}), 400
        
        print(f"🔀 Merging {len(idea_ids)} ideas: {[id[:8] for id in idea_ids]}")
        
        # Load ideas from database
        vectors, ideas = load_vector_db()
        
        # Verify all ideas exist
        missing_ids = [id for id in idea_ids if id not in ideas]
        if missing_ids:
            return jsonify({
                "error": f"Ideas not found: {missing_ids}"
            }), 404
        
        # Get idea objects
        ideas_to_merge = [ideas[id] for id in idea_ids]
        
        # Perform merge
        merge_start = time.time()
        merged_idea = evolution_processor.merge_ideas(ideas_to_merge)
        merge_time = time.time() - merge_start
        print(f"   Merge processing: {merge_time:.2f}s")
        
        # Save merged idea to database
        db_start = time.time()
        add_to_vector_db(
            merged_idea['idea_id'],
            merged_idea['embedding_vector'],
            merged_idea
        )
        db_time = time.time() - db_start
        print(f"   DB save: {db_time:.3f}s")
        
        total_time = time.time() - start_time
        print(f"✅ Merge completed in {total_time:.2f}s")
        print(f"   New idea: {merged_idea['idea_id'][:8]} - {merged_idea['distilled_data'].get('one_liner', 'N/A')}")
        
        return jsonify({
            "status": "success",
            "merged_idea": merged_idea
        })
    
    except ValueError as e:
        print(f"❌ Merge validation error: {e}")
        return jsonify({"error": str(e)}), 400
    
    except Exception as e:
        print(f"❌ Merge failed: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Merge operation failed: {str(e)}"}), 500


@app.route("/api/split_idea", methods=["POST"])
def split_idea():
    """
    Split an idea into 2-5 sub-concepts.
    
    Request body:
    {
        "idea_id": "id"
    }
    
    Returns:
    {
        "sub_ideas": [{...}, {...}],
        "status": "success"
    }
    """
    import time
    import traceback
    start_time = time.time()
    
    try:
        if not evolution_processor:
            return jsonify({"error": "Evolution processor not configured. Please set LLM_API_KEY"}), 500
        
        data = request.json
        idea_id = data.get("idea_id")
        
        # Validation
        if not idea_id:
            return jsonify({"error": "No idea_id provided"}), 400
        
        print(f"✂️  Splitting idea: {idea_id[:8]}")
        
        # Load idea from database
        vectors, ideas = load_vector_db()
        
        if idea_id not in ideas:
            return jsonify({"error": f"Idea not found: {idea_id}"}), 404
        
        idea = ideas[idea_id]
        
        # Perform split
        split_start = time.time()
        sub_ideas = evolution_processor.split_idea(idea)
        split_time = time.time() - split_start
        print(f"   Split processing: {split_time:.2f}s (created {len(sub_ideas)} sub-ideas)")
        
        # Update parent idea with child_idea_ids
        idea['child_idea_ids'] = [sub['idea_id'] for sub in sub_ideas]
        if 'linked_idea_ids' not in idea:
            idea['linked_idea_ids'] = []
        idea['linked_idea_ids'].extend(idea['child_idea_ids'])
        
        # Save all sub-ideas and updated parent to database
        db_start = time.time()
        for sub_idea in sub_ideas:
            add_to_vector_db(
                sub_idea['idea_id'],
                sub_idea['embedding_vector'],
                sub_idea
            )
        
        # Re-save parent with updated relationships
        add_to_vector_db(idea_id, vectors[idea_id], idea)
        
        db_time = time.time() - db_start
        print(f"   DB save: {db_time:.3f}s")
        
        total_time = time.time() - start_time
        print(f"✅ Split completed in {total_time:.2f}s")
        for idx, sub in enumerate(sub_ideas, 1):
            print(f"   Sub-idea {idx}: {sub['idea_id'][:8]} - {sub['distilled_data'].get('one_liner', 'N/A')}")
        
        return jsonify({
            "status": "success",
            "sub_ideas": sub_ideas,
            "updated_parent": idea
        })
    
    except ValueError as e:
        print(f"❌ Split validation error: {e}")
        return jsonify({"error": str(e)}), 400
    
    except Exception as e:
        print(f"❌ Split failed: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Split operation failed: {str(e)}"}), 500


@app.route("/api/refine_idea", methods=["POST"])
def refine_idea():
    """
    Refine an idea with additional context.
    
    Request body:
    {
        "idea_id": "id",
        "new_context": "additional information..."
    }
    
    Returns:
    {
        "refined_idea": {...},
        "status": "success"
    }
    """
    import time
    import traceback
    start_time = time.time()
    
    try:
        if not evolution_processor:
            return jsonify({"error": "Evolution processor not configured. Please set LLM_API_KEY"}), 500
        
        data = request.json
        idea_id = data.get("idea_id")
        new_context = data.get("new_context", "")
        
        # Validation
        if not idea_id:
            return jsonify({"error": "No idea_id provided"}), 400
        
        if not new_context:
            return jsonify({"error": "No new_context provided"}), 400
        
        print(f"✨ Refining idea: {idea_id[:8]}")
        print(f"   New context: {new_context[:100]}...")
        
        # Load idea from database
        vectors, ideas = load_vector_db()
        
        if idea_id not in ideas:
            return jsonify({"error": f"Idea not found: {idea_id}"}), 404
        
        idea = ideas[idea_id]
        
        # Perform refinement
        refine_start = time.time()
        refined_idea = evolution_processor.refine_idea(idea, new_context)
        refine_time = time.time() - refine_start
        print(f"   Refine processing: {refine_time:.2f}s")
        
        # Save refined idea to database
        db_start = time.time()
        add_to_vector_db(
            refined_idea['idea_id'],
            refined_idea['embedding_vector'],
            refined_idea
        )
        db_time = time.time() - db_start
        print(f"   DB save: {db_time:.3f}s")
        
        total_time = time.time() - start_time
        print(f"✅ Refine completed in {total_time:.2f}s")
        print(f"   Updated: {refined_idea['distilled_data'].get('one_liner', 'N/A')}")
        print(f"   Version: {refined_idea.get('version', 1)}")
        
        return jsonify({
            "status": "success",
            "refined_idea": refined_idea
        })
    
    except ValueError as e:
        print(f"❌ Refine validation error: {e}")
        return jsonify({"error": str(e)}), 400
    
    except Exception as e:
        print(f"❌ Refine failed: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Refine operation failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
