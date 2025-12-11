import { Idea, GraphNode, GraphEdge } from '@/types/types';

/**
 * Entity types for Level 2 graph nodes
 */
export type EntityType = 
  | 'Concept' 
  | 'Tool' 
  | 'Person' 
  | 'Problem' 
  | 'Solution' 
  | 'Methodology' 
  | 'Metric';

/**
 * Relation types for Level 2 graph edges
 */
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

/**
 * Level 1 Graph: Macro view with idea nodes and similarity edges
 */
export interface Level1GraphData {
  level: 1;
  nodes: IdeaNode[];
  edges: SimilarityEdge[];
  metadata: {
    similarityThreshold: number;
    totalIdeas: number;
  };
}

export interface IdeaNode {
  id: string;                     // idea_id
  label: string;                  // one_liner
  tags: string[];
  type: 'idea';
}

export interface SimilarityEdge {
  source: string;                 // idea_id
  target: string;                 // idea_id
  similarity: number;             // 0-1
  type: 'similarity';
}

/**
 * Level 2 Graph: Micro view with entity nodes and relation edges
 */
export interface Level2GraphData {
  level: 2;
  focusedIdeaId: string;
  nodes: EntityNode[];
  edges: RelationEdge[];
  metadata: {
    ideaOneLiner: string;
    ideaTags: string[];
  };
}

export interface EntityNode {
  id: string;                     // node id from graph_structure
  label: string;                  // node name
  type: EntityType;
  desc: string;
}

export interface RelationEdge {
  source: string;
  target: string;
  relation: RelationType;
  desc?: string;
}

/**
 * Union type for graph data at any level
 */
export type GraphData = Level1GraphData | Level2GraphData;

/**
 * Configuration for the graph level manager
 */
export interface GraphLevelConfig {
  similarityThreshold: number;    // Default: 0.7
}

/**
 * GraphLevelManager: Manages state and transitions between Level 1 and Level 2 graph views
 */
export class GraphLevelManager {
  private currentLevel: 1 | 2 = 1;
  private selectedIdeaId: string | null = null;
  private config: GraphLevelConfig;
  private ideas: Idea[] = [];

  constructor(config: Partial<GraphLevelConfig> = {}) {
    this.config = {
      similarityThreshold: config.similarityThreshold ?? 0.7,
    };
  }

  /**
   * Update the list of ideas
   */
  setIdeas(ideas: Idea[]): void {
    this.ideas = ideas;
  }

  /**
   * Get current visualization level
   */
  getCurrentLevel(): 1 | 2 {
    return this.currentLevel;
  }

  /**
   * Get currently selected idea ID (for Level 2)
   */
  getSelectedIdeaId(): string | null {
    return this.selectedIdeaId;
  }

  /**
   * Get similarity threshold
   */
  getSimilarityThreshold(): number {
    return this.config.similarityThreshold;
  }

  /**
   * Set similarity threshold
   */
  setSimilarityThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
    this.config.similarityThreshold = threshold;
  }

  /**
   * Transition to Level 2 view (micro view of a specific idea)
   */
  transitionToLevel2(ideaId: string): void {
    const idea = this.ideas.find(i => i.idea_id === ideaId);
    if (!idea) {
      throw new Error(`Idea with id ${ideaId} not found`);
    }
    this.currentLevel = 2;
    this.selectedIdeaId = ideaId;
  }

  /**
   * Transition to Level 1 view (macro view of all ideas)
   */
  transitionToLevel1(): void {
    this.currentLevel = 1;
    this.selectedIdeaId = null;
  }

  /**
   * Get graph data for current level
   */
  getGraphData(): GraphData {
    if (this.currentLevel === 1) {
      return this.getLevel1Data();
    } else {
      if (!this.selectedIdeaId) {
        throw new Error('No idea selected for Level 2 view');
      }
      return this.getLevel2Data(this.selectedIdeaId);
    }
  }

  /**
   * Generate Level 1 graph data (idea nodes + similarity edges)
   */
  private getLevel1Data(): Level1GraphData {
    // Convert ideas to nodes
    const nodes: IdeaNode[] = this.ideas.map(idea => ({
      id: idea.idea_id,
      label: idea.distilled_data.one_liner,
      tags: idea.distilled_data.tags,
      type: 'idea' as const,
    }));

    // Calculate similarity edges
    const edges: SimilarityEdge[] = [];
    
    for (let i = 0; i < this.ideas.length; i++) {
      for (let j = i + 1; j < this.ideas.length; j++) {
        const idea1 = this.ideas[i];
        const idea2 = this.ideas[j];
        
        // Only calculate similarity if both ideas have embedding vectors
        if (idea1.embedding_vector && idea2.embedding_vector) {
          const similarity = this.calculateCosineSimilarity(
            idea1.embedding_vector,
            idea2.embedding_vector
          );
          
          // Only include edges above threshold
          if (similarity >= this.config.similarityThreshold) {
            edges.push({
              source: idea1.idea_id,
              target: idea2.idea_id,
              similarity,
              type: 'similarity' as const,
            });
          }
        }
      }
    }

    return {
      level: 1,
      nodes,
      edges,
      metadata: {
        similarityThreshold: this.config.similarityThreshold,
        totalIdeas: this.ideas.length,
      },
    };
  }

  /**
   * Generate Level 2 graph data (entity nodes + relation edges for a specific idea)
   */
  private getLevel2Data(ideaId: string): Level2GraphData {
    const idea = this.ideas.find(i => i.idea_id === ideaId);
    if (!idea) {
      throw new Error(`Idea with id ${ideaId} not found`);
    }

    const graphStructure = idea.distilled_data.graph_structure;

    // Convert nodes to EntityNode format
    const nodes: EntityNode[] = graphStructure.nodes.map(node => ({
      id: node.id,
      label: node.name,
      type: node.type as EntityType,
      desc: node.desc,
    }));

    // Convert edges to RelationEdge format
    const edges: RelationEdge[] = graphStructure.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      relation: edge.relation as RelationType,
      desc: edge.desc,
    }));

    return {
      level: 2,
      focusedIdeaId: ideaId,
      nodes,
      edges,
      metadata: {
        ideaOneLiner: idea.distilled_data.one_liner,
        ideaTags: idea.distilled_data.tags,
      },
    };
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * Returns a value between 0 and 1 (or -1 and 1 for vectors with negative values)
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    if (vec1.length === 0) {
      throw new Error('Vectors cannot be empty');
    }

    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }

    // Calculate magnitudes
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    // Handle zero vectors
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    // Calculate cosine similarity
    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // Clamp to [-1, 1] to handle floating point errors
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Get all similarity edges for Level 1 (useful for external components)
   */
  getSimilarityEdges(): SimilarityEdge[] {
    const level1Data = this.getLevel1Data();
    return level1Data.edges;
  }

  /**
   * Get similarity score between two ideas
   */
  getSimilarityBetweenIdeas(ideaId1: string, ideaId2: string): number | null {
    const idea1 = this.ideas.find(i => i.idea_id === ideaId1);
    const idea2 = this.ideas.find(i => i.idea_id === ideaId2);

    if (!idea1 || !idea2) {
      return null;
    }

    if (!idea1.embedding_vector || !idea2.embedding_vector) {
      return null;
    }

    return this.calculateCosineSimilarity(
      idea1.embedding_vector,
      idea2.embedding_vector
    );
  }
}
