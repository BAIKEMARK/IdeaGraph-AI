/**
 * Example usage and manual verification of GraphLevelManager
 * This file demonstrates how to use the GraphLevelManager class
 */

import { GraphLevelManager } from './graphLevelManager';
import { Idea } from '../types';

// Example ideas for testing
const mockIdeas: Idea[] = [
  {
    idea_id: '1',
    created_at: new Date().toISOString(),
    content_raw: 'Decentralized identity using blockchain',
    distilled_data: {
      one_liner: 'Blockchain-based identity system',
      tags: ['Web3', 'Identity', 'Privacy'],
      summary: 'A system for user-controlled digital identity',
      graph_structure: {
        nodes: [
          { id: 'n1', name: 'Blockchain', type: 'Tool', desc: 'Distributed ledger' },
          { id: 'n2', name: 'Identity', type: 'Concept', desc: 'User identity' },
          { id: 'n3', name: 'Privacy', type: 'Concept', desc: 'Data privacy' },
        ],
        edges: [
          { source: 'n1', target: 'n2', relation: 'enables', desc: 'Enables secure identity' },
          { source: 'n2', target: 'n3', relation: 'relates_to', desc: 'Related to privacy' },
        ],
      },
    },
    embedding_vector: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  {
    idea_id: '2',
    created_at: new Date().toISOString(),
    content_raw: 'Smart contracts for automated agreements',
    distilled_data: {
      one_liner: 'Self-executing contracts on blockchain',
      tags: ['Web3', 'Automation', 'Contracts'],
      summary: 'Automated contract execution without intermediaries',
      graph_structure: {
        nodes: [
          { id: 'n1', name: 'Smart Contract', type: 'Tool', desc: 'Self-executing code' },
          { id: 'n2', name: 'Automation', type: 'Concept', desc: 'Automated execution' },
          { id: 'n3', name: 'Trust', type: 'Concept', desc: 'Trustless system' },
        ],
        edges: [
          { source: 'n1', target: 'n2', relation: 'enables', desc: 'Enables automation' },
          { source: 'n1', target: 'n3', relation: 'solves', desc: 'Solves trust issues' },
        ],
      },
    },
    embedding_vector: [0.15, 0.25, 0.35, 0.45, 0.55],
  },
  {
    idea_id: '3',
    created_at: new Date().toISOString(),
    content_raw: 'Machine learning for image recognition',
    distilled_data: {
      one_liner: 'AI-powered image classification',
      tags: ['AI', 'Computer Vision', 'ML'],
      summary: 'Using neural networks to classify images',
      graph_structure: {
        nodes: [
          { id: 'n1', name: 'Neural Network', type: 'Tool', desc: 'Deep learning model' },
          { id: 'n2', name: 'Image Recognition', type: 'Problem', desc: 'Classify images' },
          { id: 'n3', name: 'Training Data', type: 'Concept', desc: 'Labeled dataset' },
        ],
        edges: [
          { source: 'n1', target: 'n2', relation: 'solves', desc: 'Solves classification' },
          { source: 'n1', target: 'n3', relation: 'depends_on', desc: 'Requires training data' },
        ],
      },
    },
    embedding_vector: [0.8, 0.7, 0.1, 0.2, 0.1],
  },
];

// Example 1: Basic usage
console.log('=== Example 1: Basic GraphLevelManager Usage ===\n');

const manager = new GraphLevelManager({ similarityThreshold: 0.7 });
manager.setIdeas(mockIdeas);

console.log('Current level:', manager.getCurrentLevel()); // Should be 1
console.log('Similarity threshold:', manager.getSimilarityThreshold()); // Should be 0.7

// Example 2: Get Level 1 data
console.log('\n=== Example 2: Level 1 Graph Data ===\n');

const level1Data = manager.getGraphData();
console.log('Level:', level1Data.level);
console.log('Number of nodes:', level1Data.nodes.length);
console.log('Number of edges:', level1Data.edges.length);
console.log('Nodes:', JSON.stringify(level1Data.nodes, null, 2));
console.log('Edges:', JSON.stringify(level1Data.edges, null, 2));

// Example 3: Transition to Level 2
console.log('\n=== Example 3: Transition to Level 2 ===\n');

manager.transitionToLevel2('1');
console.log('Current level:', manager.getCurrentLevel()); // Should be 2
console.log('Selected idea:', manager.getSelectedIdeaId()); // Should be '1'

const level2Data = manager.getGraphData();
if (level2Data.level === 2) {
  console.log('Level:', level2Data.level);
  console.log('Focused idea:', level2Data.focusedIdeaId);
  console.log('Number of entity nodes:', level2Data.nodes.length);
  console.log('Number of relation edges:', level2Data.edges.length);
  console.log('Metadata:', JSON.stringify(level2Data.metadata, null, 2));
}

// Example 4: Transition back to Level 1
console.log('\n=== Example 4: Transition back to Level 1 ===\n');

manager.transitionToLevel1();
console.log('Current level:', manager.getCurrentLevel()); // Should be 1
console.log('Selected idea:', manager.getSelectedIdeaId()); // Should be null

// Example 5: Get similarity between specific ideas
console.log('\n=== Example 5: Similarity Calculations ===\n');

const sim12 = manager.getSimilarityBetweenIdeas('1', '2');
const sim13 = manager.getSimilarityBetweenIdeas('1', '3');
const sim23 = manager.getSimilarityBetweenIdeas('2', '3');

console.log('Similarity between idea 1 and 2:', sim12?.toFixed(4));
console.log('Similarity between idea 1 and 3:', sim13?.toFixed(4));
console.log('Similarity between idea 2 and 3:', sim23?.toFixed(4));

// Example 6: Change similarity threshold
console.log('\n=== Example 6: Changing Similarity Threshold ===\n');

manager.setSimilarityThreshold(0.5);
console.log('New threshold:', manager.getSimilarityThreshold());

const level1DataLowThreshold = manager.getGraphData();
console.log('Number of edges with threshold 0.5:', level1DataLowThreshold.edges.length);

manager.setSimilarityThreshold(0.9);
const level1DataHighThreshold = manager.getGraphData();
console.log('Number of edges with threshold 0.9:', level1DataHighThreshold.edges.length);

console.log('\n=== All Examples Complete ===\n');
