"""
Evolution Processor for IdeaGraph AI
Handles merge, split, and refine operations on ideas
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from openai import OpenAI
import os


# Prompts for evolution operations
MERGE_PROMPT = """You are an expert at synthesizing multiple related ideas into a unified concept.

Given these ideas:
{idea_contents}

Create a new synthesized idea that:
1. Captures the essence of all input ideas
2. Identifies common themes and unique contributions
3. Resolves any contradictions or tensions
4. Generates a unified knowledge graph structure

Return the result in standard distilled_data JSON format with this exact structure:
{{
  "one_liner": "...",
  "tags": ["tag1", "tag2"],
  "summary": "...",
  "graph_structure": {{
    "nodes": [
      {{"id": "node1", "name": "Node Name", "type": "Concept", "desc": "Description"}}
    ],
    "edges": [
      {{"source": "node1", "target": "node2", "relation": "relates_to", "desc": "Optional description"}}
    ]
  }}
}}

IMPORTANT: Return ONLY the JSON object, nothing else. No explanations, no markdown, just pure JSON.
"""

SPLIT_PROMPT = """You are an expert at decomposing complex ideas into focused sub-concepts.

Given this idea:
{idea_content}

Identify 2-5 distinct sub-concepts that:
1. Each represents a coherent, standalone aspect
2. Together cover the full scope of the original idea
3. Have minimal overlap with each other
4. Can be developed independently

For each sub-concept, return a complete distilled_data JSON structure in this format:
{{
  "sub_ideas": [
    {{
      "one_liner": "...",
      "tags": ["tag1", "tag2"],
      "summary": "...",
      "graph_structure": {{
        "nodes": [...],
        "edges": [...]
      }}
    }}
  ]
}}

IMPORTANT: Return ONLY the JSON object with an array of sub_ideas, nothing else.
"""

REFINE_PROMPT = """You are updating an existing idea with new information.

Original idea:
{original_content}

New information:
{new_context}

Generate an updated distilled_data structure that:
1. Seamlessly integrates the new information
2. Preserves valuable aspects of the original
3. Resolves any contradictions
4. Updates the knowledge graph to reflect new entities and relationships

Return the complete updated distilled_data JSON in this format:
{{
  "one_liner": "...",
  "tags": ["tag1", "tag2"],
  "summary": "...",
  "graph_structure": {{
    "nodes": [...],
    "edges": [...]
  }}
}}

IMPORTANT: Return ONLY the JSON object, nothing else.
"""


class EvolutionProcessor:
    """Handles evolution operations on ideas"""
    
    def __init__(self, llm_client: OpenAI, embedding_client: OpenAI, 
                 llm_model: str, embedding_model: str):
        self.llm_client = llm_client
        self.embedding_client = embedding_client
        self.llm_model = llm_model
        self.embedding_model = embedding_model
    
    def merge_ideas(self, ideas: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Merge multiple ideas into a synthesized concept.
        
        Args:
            ideas: List of idea dictionaries with distilled_data
            
        Returns:
            New merged idea dictionary
        """
        if len(ideas) < 2:
            raise ValueError("At least 2 ideas required for merge")
        
        # Build context from all ideas
        idea_contents = []
        for idx, idea in enumerate(ideas, 1):
            distilled = idea.get('distilled_data', {})
            content = f"""
Idea {idx}:
- One-liner: {distilled.get('one_liner', 'N/A')}
- Tags: {', '.join(distilled.get('tags', []))}
- Summary: {distilled.get('summary', 'N/A')}
- Original text: {idea.get('content_raw', 'N/A')}
"""
            idea_contents.append(content)
        
        prompt = MERGE_PROMPT.format(idea_contents='\n'.join(idea_contents))
        
        # Call LLM
        response = self.llm_client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "You are an expert idea synthesizer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content
        
        # Parse JSON response
        distilled_data = self._parse_json_response(result_text)
        
        # Create merged content_raw
        merged_content = f"Merged from {len(ideas)} ideas:\n\n"
        for idx, idea in enumerate(ideas, 1):
            merged_content += f"{idx}. {idea.get('content_raw', '')}\n\n"
        
        # Generate embedding
        embedding_vector = self._generate_embedding(merged_content)
        
        # Create new idea
        merged_idea = {
            'idea_id': str(uuid.uuid4()),
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'content_raw': merged_content.strip(),
            'distilled_data': distilled_data,
            'embedding_vector': embedding_vector,
            'merged_from_ids': [idea['idea_id'] for idea in ideas],
            'linked_idea_ids': [idea['idea_id'] for idea in ideas]
        }
        
        return merged_idea
    
    def split_idea(self, idea: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Split an idea into 2-5 sub-concepts.
        
        Args:
            idea: Idea dictionary to split
            
        Returns:
            List of new sub-idea dictionaries
        """
        distilled = idea.get('distilled_data', {})
        
        idea_content = f"""
One-liner: {distilled.get('one_liner', 'N/A')}
Tags: {', '.join(distilled.get('tags', []))}
Summary: {distilled.get('summary', 'N/A')}
Original text: {idea.get('content_raw', 'N/A')}
"""
        
        prompt = SPLIT_PROMPT.format(idea_content=idea_content)
        
        # Call LLM
        response = self.llm_client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "You are an expert at decomposing complex ideas."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content
        
        # Parse JSON response
        result = self._parse_json_response(result_text)
        sub_ideas_data = result.get('sub_ideas', [])
        
        if not sub_ideas_data or len(sub_ideas_data) < 2 or len(sub_ideas_data) > 5:
            raise ValueError(f"Split must produce 2-5 sub-ideas, got {len(sub_ideas_data)}")
        
        # Create sub-idea objects
        sub_ideas = []
        parent_id = idea['idea_id']
        
        for idx, sub_data in enumerate(sub_ideas_data, 1):
            # Generate content_raw for sub-idea
            sub_content = f"Split from: {distilled.get('one_liner', 'Original idea')}\n\n"
            sub_content += f"Sub-concept {idx}: {sub_data.get('summary', '')}"
            
            # Generate embedding
            embedding_vector = self._generate_embedding(sub_content)
            
            sub_idea = {
                'idea_id': str(uuid.uuid4()),
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'content_raw': sub_content,
                'distilled_data': sub_data,
                'embedding_vector': embedding_vector,
                'parent_idea_id': parent_id,
                'linked_idea_ids': [parent_id]
            }
            sub_ideas.append(sub_idea)
        
        return sub_ideas
    
    def refine_idea(self, idea: Dict[str, Any], new_context: str) -> Dict[str, Any]:
        """
        Refine an idea with additional context.
        
        Args:
            idea: Original idea dictionary
            new_context: New information to integrate
            
        Returns:
            Updated idea dictionary
        """
        distilled = idea.get('distilled_data', {})
        
        original_content = f"""
One-liner: {distilled.get('one_liner', 'N/A')}
Tags: {', '.join(distilled.get('tags', []))}
Summary: {distilled.get('summary', 'N/A')}
Original text: {idea.get('content_raw', 'N/A')}
"""
        
        prompt = REFINE_PROMPT.format(
            original_content=original_content,
            new_context=new_context
        )
        
        # Call LLM
        response = self.llm_client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "You are an expert at refining and updating ideas."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content
        
        # Parse JSON response
        updated_distilled = self._parse_json_response(result_text)
        
        # Update content_raw with appended notes
        updated_content = idea.get('content_raw', '') + f"\n\n[Refined with: {new_context}]"
        
        # Generate new embedding
        embedding_vector = self._generate_embedding(updated_content)
        
        # Create updated idea
        refined_idea = idea.copy()
        refined_idea['distilled_data'] = updated_distilled
        refined_idea['content_raw'] = updated_content
        refined_idea['embedding_vector'] = embedding_vector
        refined_idea['last_modified'] = datetime.utcnow().isoformat() + 'Z'
        refined_idea['version'] = refined_idea.get('version', 1) + 1
        
        return refined_idea
    
    def establish_relationships(self, parent_id: str, child_ids: List[str], 
                               relation_type: str, ideas_db: Dict[str, Any]) -> None:
        """
        Create linked_idea_ids relationships between ideas.
        
        Args:
            parent_id: Parent idea ID
            child_ids: List of child idea IDs
            relation_type: Type of relationship ('merge', 'split', 'refine')
            ideas_db: Ideas database to update
        """
        # Update parent idea
        if parent_id in ideas_db:
            parent = ideas_db[parent_id]
            
            if relation_type == 'split':
                parent['child_idea_ids'] = child_ids
                if 'linked_idea_ids' not in parent:
                    parent['linked_idea_ids'] = []
                parent['linked_idea_ids'].extend(child_ids)
            
            # Update children
            for child_id in child_ids:
                if child_id in ideas_db:
                    child = ideas_db[child_id]
                    if 'linked_idea_ids' not in child:
                        child['linked_idea_ids'] = []
                    if parent_id not in child['linked_idea_ids']:
                        child['linked_idea_ids'].append(parent_id)
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response, handling markdown code blocks"""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if "```json" in text:
                json_start = text.find("```json") + 7
                json_end = text.find("```", json_start)
                text = text[json_start:json_end].strip()
            elif "```" in text:
                json_start = text.find("```") + 3
                json_end = text.find("```", json_start)
                text = text[json_start:json_end].strip()
            
            return json.loads(text)
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        response = self.embedding_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
