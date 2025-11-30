# Utils Directory

This directory contains utility classes and helper functions for the IdeaGraph application.

## GraphLevelManager

The `GraphLevelManager` class manages the hierarchical visualization of the knowledge graph with two levels:

### Level 1: Macro View
- Shows all ideas as nodes
- Displays similarity relationships between ideas as edges
- Filters edges by configurable similarity threshold (default: 0.7)
- Useful for understanding the overall structure of your knowledge base

### Level 2: Micro View
- Shows detailed entity-relationship graph for a single idea
- Displays entities (Concepts, Tools, People, Problems, Solutions, etc.)
- Shows relationships between entities (solves, causes, enables, etc.)
- Useful for exploring the internal structure of a specific idea

### Usage Example

```typescript
import { GraphLevelManager } from './utils/graphLevelManager';
import { Idea } from './types';

// Create manager with custom threshold
const manager = new GraphLevelManager({ 
  similarityThreshold: 0.7 
});

// Set ideas
manager.setIdeas(ideas);

// Get Level 1 data (macro view)
const level1Data = manager.getGraphData();
// Returns: { level: 1, nodes: [...], edges: [...], metadata: {...} }

// Transition to Level 2 (micro view)
manager.transitionToLevel2(ideaId);
const level2Data = manager.getGraphData();
// Returns: { level: 2, focusedIdeaId: '...', nodes: [...], edges: [...], metadata: {...} }

// Transition back to Level 1
manager.transitionToLevel1();

// Get similarity between two ideas
const similarity = manager.getSimilarityBetweenIdeas(ideaId1, ideaId2);
```

### Key Features

1. **Similarity Calculation**: Uses cosine similarity to measure semantic relatedness between ideas based on their embedding vectors

2. **Threshold Filtering**: Only displays edges with similarity scores above the configured threshold

3. **State Management**: Tracks current level and selected idea for seamless transitions

4. **Type Safety**: Full TypeScript support with discriminated unions for Level 1 and Level 2 data

### Configuration

```typescript
interface GraphLevelConfig {
  similarityThreshold: number;  // Default: 0.7, Range: 0-1
}
```

### Data Types

#### Level 1 Data
```typescript
interface Level1GraphData {
  level: 1;
  nodes: IdeaNode[];           // One node per idea
  edges: SimilarityEdge[];     // Filtered by threshold
  metadata: {
    similarityThreshold: number;
    totalIdeas: number;
  };
}
```

#### Level 2 Data
```typescript
interface Level2GraphData {
  level: 2;
  focusedIdeaId: string;
  nodes: EntityNode[];         // Entities from graph_structure
  edges: RelationEdge[];       // Relations from graph_structure
  metadata: {
    ideaOneLiner: string;
    ideaTags: string[];
  };
}
```

### Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: Display Level 1 view showing only Idea root nodes
- **Requirement 2.2**: Show only strong semantic similarity relationships between ideas
- **Requirement 2.3**: Transition to Level 2 view displaying the sub-graph with detailed entities
- **Requirement 11.2**: Show only relationships with similarity scores above configurable threshold

### Testing

See `graphLevelManager.test.example.ts` for usage examples and manual verification.
