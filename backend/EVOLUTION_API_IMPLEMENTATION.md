# Evolution Command API Implementation

## Overview

This document describes the implementation of the three evolution command API endpoints for IdeaGraph AI: merge, split, and refine operations.

## Files Created/Modified

### New Files

1. **backend/evolution_processor.py**
   - Core evolution logic for merge, split, and refine operations
   - Handles LLM interactions with proper prompt engineering
   - Generates embeddings for new/updated ideas
   - Manages relationship establishment between ideas

2. **backend/tests/test_evolution_endpoints.py**
   - Comprehensive test suite for all three endpoints
   - Validation tests for request parameters
   - Full integration test with real LLM calls
   - Tests error handling and edge cases

### Modified Files

1. **backend/app.py**
   - Added three new API endpoints: `/api/merge_ideas`, `/api/split_idea`, `/api/refine_idea`
   - Integrated EvolutionProcessor class
   - Added comprehensive logging for all operations
   - Implemented proper error handling and validation

## API Endpoints

### 1. POST /api/merge_ideas

Merges multiple ideas into a synthesized concept.

**Request Body:**
```json
{
  "idea_ids": ["id1", "id2", ...]
}
```

**Response:**
```json
{
  "status": "success",
  "merged_idea": {
    "idea_id": "...",
    "created_at": "...",
    "content_raw": "...",
    "distilled_data": {...},
    "embedding_vector": [...],
    "merged_from_ids": ["id1", "id2"],
    "linked_idea_ids": ["id1", "id2"]
  }
}
```

**Validation:**
- Requires at least 2 idea_ids
- All idea_ids must exist in the database
- Returns 400 for validation errors
- Returns 404 for non-existent ideas

**Features:**
- Synthesizes content from all source ideas
- Creates new embedding for merged content
- Establishes relationships via merged_from_ids and linked_idea_ids
- Logs operation timing and results

### 2. POST /api/split_idea

Splits an idea into 2-5 sub-concepts.

**Request Body:**
```json
{
  "idea_id": "id"
}
```

**Response:**
```json
{
  "status": "success",
  "sub_ideas": [
    {
      "idea_id": "...",
      "created_at": "...",
      "content_raw": "...",
      "distilled_data": {...},
      "embedding_vector": [...],
      "parent_idea_id": "original_id",
      "linked_idea_ids": ["original_id"]
    }
  ],
  "updated_parent": {
    "child_idea_ids": ["sub1", "sub2", ...],
    "linked_idea_ids": [...]
  }
}
```

**Validation:**
- Requires valid idea_id
- Idea must exist in database
- LLM must generate 2-5 sub-ideas
- Returns 400 for validation errors
- Returns 404 for non-existent ideas

**Features:**
- Generates 2-5 focused sub-concepts
- Creates embeddings for each sub-idea
- Updates parent with child_idea_ids
- Establishes parent-child relationships
- Logs all created sub-ideas

### 3. POST /api/refine_idea

Refines an idea with additional context.

**Request Body:**
```json
{
  "idea_id": "id",
  "new_context": "additional information..."
}
```

**Response:**
```json
{
  "status": "success",
  "refined_idea": {
    "idea_id": "...",
    "created_at": "...",
    "content_raw": "...[Refined with: ...]",
    "distilled_data": {...},
    "embedding_vector": [...],
    "last_modified": "...",
    "version": 2
  }
}
```

**Validation:**
- Requires valid idea_id and new_context
- Idea must exist in database
- Returns 400 for validation errors
- Returns 404 for non-existent ideas

**Features:**
- Integrates new context with original idea
- Appends refinement notes to content_raw
- Generates new embedding for updated content
- Increments version number
- Tracks last_modified timestamp
- Logs version changes

## Error Handling

All endpoints implement comprehensive error handling:

1. **Request Validation**
   - Missing required fields → 400 Bad Request
   - Invalid parameter values → 400 Bad Request
   - Non-existent ideas → 404 Not Found

2. **LLM Errors**
   - API configuration issues → 500 Internal Server Error
   - JSON parsing failures → 500 Internal Server Error
   - Timeout/network errors → 500 Internal Server Error

3. **Database Errors**
   - Save failures → 500 Internal Server Error
   - Load failures → 500 Internal Server Error

4. **Logging**
   - All operations log start time, processing time, and results
   - Errors include full traceback for debugging
   - Success messages include key details (IDs, one-liners, etc.)

## Testing

### Test Coverage

The test suite (`test_evolution_endpoints.py`) covers:

1. **Health Check** - Verifies server is running and configured
2. **Merge Validation** - Tests all validation rules
3. **Split Validation** - Tests all validation rules
4. **Refine Validation** - Tests all validation rules
5. **Full Evolution Flow** - End-to-end test with real LLM calls

### Test Results

All tests passed successfully:
- ✅ Health check
- ✅ Merge validation (no IDs, single ID, non-existent IDs)
- ✅ Split validation (no ID, non-existent ID)
- ✅ Refine validation (no ID, no context, non-existent ID)
- ✅ Full flow (create → merge → refine → split)

### Running Tests

```bash
cd backend/tests
python test_evolution_endpoints.py
```

**Prerequisites:**
- Backend server running on port 5000
- Valid LLM API key configured
- Vector database initialized

## Implementation Details

### EvolutionProcessor Class

The `EvolutionProcessor` class encapsulates all evolution logic:

**Methods:**
- `merge_ideas(ideas)` - Merges multiple ideas
- `split_idea(idea)` - Splits idea into sub-concepts
- `refine_idea(idea, new_context)` - Refines idea with new info
- `establish_relationships(parent_id, child_ids, relation_type, ideas_db)` - Manages relationships
- `_parse_json_response(text)` - Handles LLM JSON parsing
- `_generate_embedding(text)` - Creates embeddings

**Prompts:**
- `MERGE_PROMPT` - Guides LLM to synthesize ideas
- `SPLIT_PROMPT` - Guides LLM to decompose ideas
- `REFINE_PROMPT` - Guides LLM to integrate new context

### Database Integration

All operations properly integrate with the vector database:
- Save new ideas with embeddings
- Update existing ideas with new relationships
- Maintain referential integrity via linked_idea_ids
- Preserve parent-child relationships

### Performance

Typical operation times (with DeepSeek-V3.2-Exp):
- Merge: ~13 seconds (LLM call + embedding generation)
- Split: ~20 seconds (LLM call + multiple embeddings)
- Refine: ~14 seconds (LLM call + embedding generation)

Database operations are fast (<100ms) due to pickle-based storage.

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 3.3, 3.4** - Refine operation with context integration
- **Requirement 4.2, 4.3** - Merge operation with relationship establishment
- **Requirement 5.2, 5.3, 5.4, 5.5** - Split operation with proper sub-idea generation

## Next Steps

To complete the evolution command feature:

1. **Task 8** - Connect frontend evolution commands to these backend endpoints
2. **Task 6** - Add property-based tests for evolution operations (optional)
3. **Integration** - Wire up EvolutionCommandUI component to call these APIs

## Notes

- The evolution processor was created as part of this task since it's a dependency
- All endpoints follow RESTful conventions
- Logging is comprehensive for debugging and monitoring
- Error messages are user-friendly while preserving technical details in logs
