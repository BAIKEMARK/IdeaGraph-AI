# Quick Start - Graph RAG Features

## Install Dependencies

### Backend
```bash
pip install -r backend/requirements.txt
```

### Frontend
```bash
npm install
```

## Configure API

Copy `config/.env.example` to `config/.env` and fill in your API keys:

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

EMBEDDING_API_KEY=your_api_key_here
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd backend
python app.py
```

Backend will run on `http://localhost:5000`

### 2. Start Frontend (Terminal 2)
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Test Graph RAG

### Method 1: Use Test Script
```bash
cd backend/tests
python test_rag.py
```

This will test:
- ✅ Backend health check
- ✅ Idea distillation and embedding generation
- ✅ Vector database saving
- ✅ Similarity search
- ✅ RAG-enhanced conversation

### Method 2: Test in Browser

1. **Create First Idea**
   - Enter in the left input box:
     ```
     Blockchain technology enables users to control their digital identity 
     through decentralization, no longer relying on centralized platforms 
     like Google or Facebook.
     ```
   - Click "Capture" button
   - Observe the generated knowledge graph

2. **Create Second Idea**
   - Enter a related topic:
     ```
     Web3 applications use smart contracts to enable trustless transactions, 
     allowing users to interact peer-to-peer without intermediaries.
     ```
   - Click "Capture"

3. **View Related Ideas**
   - Select any idea
   - The right panel will show "Related Ideas" at the top
   - Shows similarity percentages

4. **Test RAG Conversation**
   - Enter in the chat box:
     ```
     How does this idea connect to other concepts?
     ```
   - AI will reference related ideas and graph structure in response

## Verify RAG is Working

### Check Vector Database Files
```bash
# You should see these two files
ls backend/data/vector_db.pkl
ls backend/data/ideas_db.pkl
```

### View Backend Logs
Backend will output similarity search results, for example:
```
Found 2 similar ideas for current idea
Similarity scores: [0.87, 0.72]
```

### Frontend Interface Verification
- ✅ Right panel shows "Related Ideas"
- ✅ Shows similarity percentages (e.g., 87%)
- ✅ AI mentions related ideas during conversation

## Common Issues

### Q: Related ideas not showing?
A: You need at least 2 ideas for similarity search

### Q: Where are the vector database files?
A: In the `backend/data/` directory, created automatically

### Q: How to clear the database?
A: Delete `vector_db.pkl` and `ideas_db.pkl` files

### Q: Which APIs are supported?
A: Any OpenAI-compatible API:
- OpenAI
- Azure OpenAI
- Local models (Ollama, LM Studio)
- Other providers (DeepSeek, Moonshot, etc.)

## Next Steps

- 📖 Read [GRAPH_RAG_GUIDE.md](GRAPH_RAG_GUIDE.md) for implementation details
- 🔧 Check [API_CONFIGURATION.md](../api/API_CONFIGURATION.md) to configure different APIs
- 🚀 Start capturing your ideas and building knowledge graphs!