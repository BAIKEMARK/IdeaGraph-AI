// Entity types for graph nodes
export type EntityType = 
  | 'Concept' 
  | 'Tool' 
  | 'Person' 
  | 'Problem' 
  | 'Solution' 
  | 'Methodology' 
  | 'Metric';

// Relation types for graph edges
export type RelationType = 
  | 'solves' 
  | 'causes' 
  | 'contradicts' 
  | 'consists_of' 
  | 'depends_on'
  | 'enables'
  | 'disrupts'
  | 'powered_by'
  | 'relates_to';

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
  parent_idea_id?: string;      // For split ideas
  child_idea_ids?: string[];    // For ideas that have been split
  merged_from_ids?: string[];   // For merged ideas
  chat_history?: ChatMessage[];
  last_modified?: string;       // ISO timestamp
  version?: number;             // For tracking refinements
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date | string; // Allow string for serialization
}