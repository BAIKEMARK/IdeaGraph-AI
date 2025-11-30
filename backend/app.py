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

CHAT_SYSTEM_PROMPT = """You are a helpful AI assistant discussing ideas with the user.
You have context about the current idea being discussed. Help the user explore, refine, and expand their thoughts.
Be conversational, insightful, and ask clarifying questions when appropriate.
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
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def search_similar_ideas(query_embedding, top_k=3, exclude_id=None):
    """Search for similar ideas using cosine similarity"""
    vectors, ideas = load_vector_db()
    
    if not vectors:
        return []
    
    query_vec = np.array(query_embedding)
    similarities = []
    
    for idea_id, vec in vectors.items():
        if idea_id == exclude_id:
            continue
        sim = cosine_similarity(query_vec, vec)
        similarities.append((idea_id, sim, ideas[idea_id]))
    
    # Sort by similarity (descending)
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    return similarities[:top_k]

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
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat about an idea using OpenAI-compatible API with RAG"""
    import time
    start_time = time.time()
    
    try:
        if not llm_client:
            return jsonify({"error": "API not configured. Please set LLM_API_KEY in backend/.env"}), 500
        
        data = request.json
        history = data.get("history", [])
        # 兼容两种命名方式
        current_idea = data.get("currentIdea") or data.get("current_idea", {})
        
        # Get current idea embedding for similarity search
        current_embedding = current_idea.get("embedding_vector")
        current_id = current_idea.get("idea_id")
        
        # Build context from current idea
        rag_start = time.time()
        idea_context = f"""
Current Idea Context:
- Summary: {current_idea.get('distilled_data', {}).get('one_liner', 'N/A')}
- Tags: {', '.join(current_idea.get('distilled_data', {}).get('tags', []))}
- Details: {current_idea.get('distilled_data', {}).get('summary', 'N/A')}
"""
        
        # RAG: Search for similar ideas if embedding exists
        if current_embedding:
            similar_ideas = search_similar_ideas(current_embedding, top_k=3, exclude_id=current_id)
            
            if similar_ideas:
                idea_context += "\n\nRelated Ideas (for context):\n"
                for idx, (idea_id, sim, idea_data) in enumerate(similar_ideas, 1):
                    distilled = idea_data.get('distilled_data', {})
                    idea_context += f"{idx}. [{distilled.get('one_liner', 'N/A')}] (similarity: {sim:.2f})\n"
                    idea_context += f"   Tags: {', '.join(distilled.get('tags', []))}\n"
        
        # Graph traversal: Extract concepts from current idea
        graph_info = traverse_graph(current_idea)
        if graph_info['concepts']:
            idea_context += f"\n\nKey Concepts: {', '.join(graph_info['concepts'][:5])}\n"
        if graph_info['relations']:
            idea_context += f"Relationships: {'; '.join(graph_info['relations'][:3])}\n"
        
        rag_time = time.time() - rag_start
        print(f"⏱️  RAG processing: {rag_time:.3f}s")
        
        # Convert history to OpenAI format
        messages = [
            {"role": "system", "content": CHAT_SYSTEM_PROMPT + "\n\n" + idea_context}
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
        
        total_time = time.time() - start_time
        print(f"✅ Total chat time: {total_time:.2f}s")
        
        return jsonify({"text": reply})
    
    except Exception as e:
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
