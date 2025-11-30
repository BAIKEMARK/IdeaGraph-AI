# Requirements Document: IdeaGraph AI Enhancement

## Introduction

This document outlines the requirements for enhancing IdeaGraph AI to fully align with the PRD specifications. The system currently implements basic idea capture, distillation, and visualization, but lacks several critical features including hierarchical graph views, evolution commands (merge/split/refine), proper prompt engineering, and complete data schema compliance.

## Glossary

- **IdeaGraph System**: The complete application including frontend and backend components
- **Distillation Engine**: The AI-powered component that transforms raw text into structured knowledge graphs
- **Evolution Commands**: User-initiated operations to merge, split, or refine ideas
- **RAG (Retrieval-Augmented Generation)**: Technique combining vector search with LLM responses
- **Sub-graph**: The detailed entity-relationship structure within a single idea
- **One-Liner**: A concise insight (max 20 words) capturing the essence of an idea
- **Vector Database**: Storage system for embeddings enabling semantic similarity search
- **Chat Workbench**: Interactive interface for conversing with AI about ideas

## Requirements

### Requirement 1: Enhanced Distillation with Proper Prompt Engineering

**User Story:** As a user, I want the AI to extract structured knowledge graphs from my ideas using proven prompt patterns, so that the distillation quality is consistent and comprehensive.

#### Acceptance Criteria

1. WHEN the Distillation Engine processes user input THEN the IdeaGraph System SHALL use the SYSTEM_PROMPT_DISTILL template defined in the PRD
2. WHEN extracting entities THEN the Distillation Engine SHALL classify nodes using the defined entity types: Concept, Tool, Person, Problem, Solution, Methodology, or Metric
3. WHEN identifying relationships THEN the Distillation Engine SHALL prioritize logical relationships such as "solves", "causes", "contradicts", "consists_of", "depends_on"
4. WHEN generating the One-Liner THEN the Distillation Engine SHALL ensure it does not exceed 20 words
5. WHEN the distillation completes THEN the IdeaGraph System SHALL validate the output matches the complete JSON schema including all required fields

### Requirement 2: Hierarchical Graph Visualization

**User Story:** As a user, I want to view my knowledge graph at different levels of detail, so that I can avoid visual noise while exploring complex idea networks.

#### Acceptance Criteria

1. WHEN the user views the main graph THEN the IdeaGraph System SHALL display Level 1 view showing only Idea root nodes and high-frequency tags
2. WHEN displaying Level 1 connections THEN the IdeaGraph System SHALL show only strong semantic similarity relationships between ideas
3. WHEN the user clicks an Idea node THEN the IdeaGraph System SHALL transition to Level 2 view displaying the sub-graph with detailed entities and relationships
4. WHEN in Level 2 view THEN the IdeaGraph System SHALL provide a visual indicator to return to Level 1 view
5. WHEN switching between levels THEN the IdeaGraph System SHALL animate the transition smoothly without jarring visual changes

### Requirement 3: Evolution Commands - Refine

**User Story:** As a user, I want to refine my ideas through conversation, so that the AI automatically updates the knowledge graph structure as I add details.

#### Acceptance Criteria

1. WHEN the user discusses an idea in the Chat Workbench THEN the IdeaGraph System SHALL detect when new information significantly expands or contradicts existing content
2. WHEN significant new information is detected THEN the IdeaGraph System SHALL suggest updating the idea with a confirmation prompt
3. WHEN the user confirms a refinement THEN the Distillation Engine SHALL regenerate the graph structure incorporating both old and new information
4. WHEN the refinement completes THEN the IdeaGraph System SHALL update the idea's distilled_data while preserving the original content_raw with appended notes
5. WHEN the graph updates THEN the IdeaGraph System SHALL reflect changes in the visualization immediately

### Requirement 4: Evolution Commands - Merge

**User Story:** As a user, I want to merge related ideas into a synthesized concept, so that I can consolidate overlapping thoughts into a coherent whole.

#### Acceptance Criteria

1. WHEN the user selects multiple ideas THEN the IdeaGraph System SHALL enable a "Merge Ideas" command in the interface
2. WHEN the user triggers merge THEN the Distillation Engine SHALL analyze both ideas and generate a new synthesized idea containing the essence of both
3. WHEN creating the merged idea THEN the IdeaGraph System SHALL establish inheritance relationships linking the new idea to its source ideas
4. WHEN the merge completes THEN the IdeaGraph System SHALL add the merged idea to the database with linked_idea_ids referencing source ideas
5. WHEN displaying the merged idea THEN the IdeaGraph System SHALL show visual indicators of its source ideas in the graph view

### Requirement 5: Evolution Commands - Split

**User Story:** As a user, I want to split complex ideas into multiple focused concepts, so that I can better organize and explore individual aspects.

#### Acceptance Criteria

1. WHEN the user selects an idea and triggers split THEN the IdeaGraph System SHALL enable a "Split Idea" command
2. WHEN the split command executes THEN the Distillation Engine SHALL analyze the content and identify 2-5 distinct sub-concepts
3. WHEN creating split ideas THEN the IdeaGraph System SHALL generate separate idea cards for each sub-concept with proper distillation
4. WHEN the split completes THEN the IdeaGraph System SHALL establish parent-child relationships between the original and split ideas
5. WHEN displaying split ideas THEN the IdeaGraph System SHALL maintain the original idea and mark it as having child ideas

### Requirement 6: Enhanced RAG with Proper Prompt Engineering

**User Story:** As a user, I want contextual AI responses that synthesize information from my knowledge graph, so that conversations are grounded in my existing ideas.

#### Acceptance Criteria

1. WHEN the Chat Workbench processes a message THEN the IdeaGraph System SHALL use the SYSTEM_PROMPT_CHAT template defined in the PRD
2. WHEN building context THEN the IdeaGraph System SHALL include both Knowledge Graph Data (structure and relationships) and Document Chunks (detailed content)
3. WHEN providing answers THEN the IdeaGraph System SHALL use citation style with [n] markers referencing source chunks
4. WHEN detecting evolution opportunities THEN the IdeaGraph System SHALL explicitly suggest update actions at the end of responses
5. WHEN a new concept emerges THEN the IdeaGraph System SHALL ask if the user wants to create a new idea card

### Requirement 7: Keyword Extraction for Enhanced Retrieval

**User Story:** As a developer, I want the system to extract both high-level and low-level keywords from queries, so that retrieval is more accurate and comprehensive.

#### Acceptance Criteria

1. WHEN processing a search or chat query THEN the IdeaGraph System SHALL extract keywords using the SYSTEM_PROMPT_KEYWORDS template
2. WHEN extracting keywords THEN the IdeaGraph System SHALL identify high-level keywords representing themes and abstract concepts
3. WHEN extracting keywords THEN the IdeaGraph System SHALL identify low-level keywords representing specific entities and proper nouns
4. WHEN keywords are extracted THEN the IdeaGraph System SHALL return a JSON object with separate high_level_keywords and low_level_keywords arrays
5. WHEN performing retrieval THEN the IdeaGraph System SHALL use both keyword types to improve search relevance

### Requirement 8: Complete Data Schema Compliance

**User Story:** As a developer, I want all ideas to conform to the complete data schema, so that the system maintains data integrity and supports all features.

#### Acceptance Criteria

1. WHEN storing an idea THEN the IdeaGraph System SHALL validate it contains all required fields: idea_id, created_at, content_raw, distilled_data, embedding_vector
2. WHEN storing distilled_data THEN the IdeaGraph System SHALL validate it contains: one_liner, tags, summary, graph_structure
3. WHEN storing graph_structure THEN the IdeaGraph System SHALL validate nodes contain: id, name, type, desc
4. WHEN storing graph_structure THEN the IdeaGraph System SHALL validate edges contain: source, target, relation, and optional desc
5. WHEN ideas reference other ideas THEN the IdeaGraph System SHALL maintain the linked_idea_ids array with valid UUID references

### Requirement 9: Multi-Idea Context Selection

**User Story:** As a user, I want to select multiple ideas and discuss them together, so that I can explore connections and synthesize insights across my knowledge base.

#### Acceptance Criteria

1. WHEN viewing the idea list THEN the IdeaGraph System SHALL provide checkboxes or multi-select capability for ideas
2. WHEN multiple ideas are selected THEN the IdeaGraph System SHALL enable a "Chat with Selected" button
3. WHEN entering multi-idea chat THEN the IdeaGraph System SHALL inject context from all selected ideas into the RAG system
4. WHEN displaying the chat interface THEN the IdeaGraph System SHALL show indicators of which ideas are in context
5. WHEN the user deselects an idea THEN the IdeaGraph System SHALL update the context and notify the user

### Requirement 10: Image Input Support (OCR)

**User Story:** As a user, I want to upload images containing text, so that I can capture ideas from photos, screenshots, and handwritten notes.

#### Acceptance Criteria

1. WHEN the capture interface loads THEN the IdeaGraph System SHALL display an image upload button alongside text input
2. WHEN the user uploads an image THEN the IdeaGraph System SHALL validate the file type is a supported image format
3. WHEN processing an image THEN the IdeaGraph System SHALL use OCR or vision API to extract text content
4. WHEN OCR completes THEN the IdeaGraph System SHALL populate the text input field with extracted content for user review
5. WHEN the user confirms THEN the IdeaGraph System SHALL proceed with normal distillation using the extracted text

### Requirement 11: Graph Relationship Strength Visualization

**User Story:** As a user, I want to see the strength of relationships between ideas visually, so that I can identify the most important connections in my knowledge graph.

#### Acceptance Criteria

1. WHEN calculating idea relationships THEN the IdeaGraph System SHALL compute semantic similarity scores using cosine similarity of embeddings
2. WHEN displaying Level 1 graph THEN the IdeaGraph System SHALL show only relationships with similarity scores above a configurable threshold
3. WHEN rendering edges THEN the IdeaGraph System SHALL vary line thickness based on relationship strength
4. WHEN rendering edges THEN the IdeaGraph System SHALL vary line opacity based on relationship strength
5. WHEN hovering over an edge THEN the IdeaGraph System SHALL display a tooltip showing the exact similarity score

### Requirement 12: Persistent Chat History

**User Story:** As a user, I want my conversations about each idea to be saved, so that I can return to previous discussions and maintain context over time.

#### Acceptance Criteria

1. WHEN a chat message is sent or received THEN the IdeaGraph System SHALL append it to the idea's chat_history array
2. WHEN switching to a different idea THEN the IdeaGraph System SHALL save the current chat_history to the Vector Database
3. WHEN selecting an idea with existing chat_history THEN the IdeaGraph System SHALL load and display the previous conversation
4. WHEN displaying chat history THEN the IdeaGraph System SHALL preserve message timestamps and role information
5. WHEN the user clears chat history THEN the IdeaGraph System SHALL remove it from the idea while keeping the idea itself intact
