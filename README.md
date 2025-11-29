# IdeaGraph AI - Graph RAG Knowledge Management

A knowledge management system that uses Graph RAG (Retrieval-Augmented Generation) to structure, visualize, and connect your ideas.

## Features

- **AI-Powered Distillation**: Automatically extract key concepts, tags, and relationships from raw text
- **Knowledge Graph Visualization**: Interactive D3.js graph showing concept relationships
- **Vector Search**: Find similar ideas using semantic embeddings
- **Graph RAG**: Chat with context from related ideas and graph structure
- **Local Vector Database**: Simple file-based storage (no external dependencies)
- **Bilingual Support**: English and Chinese interface

View your app in AI Studio: https://ai.studio/apps/drive/15ApUloCDkaauvoYr9JpX1PgKEELh0XDB

## Run Locally

**Prerequisites:**  Node.js, Python 3.8+

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API keys in [.env.local](.env.local):
   ```env
   LLM_API_KEY=your_api_key_here
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   
   EMBEDDING_API_KEY=your_api_key_here
   EMBEDDING_BASE_URL=https://api.openai.com/v1
   EMBEDDING_MODEL=text-embedding-3-small
   ```

3. Run the frontend:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Run the backend server:
   ```bash
   python backend/app.py
   ```

The backend will run on `http://localhost:5000`

## How Graph RAG Works

1. **Idea Capture**: Enter raw text → AI extracts structure (nodes, edges, tags)
2. **Vector Storage**: Each idea gets an embedding vector stored locally in `vector_db.pkl`
3. **Similarity Search**: When viewing an idea, find related ideas using cosine similarity
4. **Graph Traversal**: Extract concepts and relationships from the knowledge graph
5. **RAG Chat**: AI assistant uses related ideas + graph context to provide informed responses

## Data Storage

- `vector_db.pkl`: Stores embedding vectors for similarity search
- `ideas_db.pkl`: Stores complete idea data with metadata

These files are created automatically in the backend directory.

## Supported API Providers

This app supports any OpenAI-compatible API, including:

- **OpenAI**: Use `https://api.openai.com/v1`
- **Azure OpenAI**: Use your Azure endpoint
- **Local models** (Ollama, LM Studio): Use `http://localhost:11434/v1` or similar
- **Other providers** (DeepSeek, Moonshot, etc.): Use their respective endpoints

See [.env.example](.env.example) for configuration examples.
