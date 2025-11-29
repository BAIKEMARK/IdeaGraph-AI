export interface GraphNode {
  id: string;
  name: string;
  type: string; // e.g., "Concept", "Tool", "Person"
  desc: string;
}

export interface GraphEdge {
  source: string; // ID of source node
  target: string; // ID of target node
  relation: string;
  desc?: string;
}

export interface GraphStructure {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DistilledData {
  one_liner: string;
  tags: string[];
  summary: string;
  graph_structure: GraphStructure;
}

export interface Idea {
  idea_id: string;
  created_at: string;
  content_raw: string;
  distilled_data: DistilledData;
  embedding_vector?: number[];
  linked_idea_ids?: string[];
  chat_history?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date | string; // Allow string for serialization
}