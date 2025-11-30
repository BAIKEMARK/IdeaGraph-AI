# IdeaGraph AI - Backend

Flask 后端服务，提供 AI 驱动的想法处理和 RAG 功能。

## API 端点

### POST /api/distill
提炼原始文本为结构化想法

**请求体**:
```json
{
  "text": "你的想法文本"
}
```

**响应**:
```json
{
  "one_liner": "一句话总结",
  "tags": ["标签1", "标签2"],
  "summary": "详细摘要",
  "graph_structure": {
    "nodes": [...],
    "edges": [...]
  },
  "embedding_vector": [...]
}
```

### POST /api/save_idea
保存想法到向量数据库

### POST /api/search_similar
搜索相似想法

### POST /api/chat
与 AI 对话

### GET /api/get_all_ideas
获取所有想法

### GET /api/health
健康检查

## 环境变量

在 `backend/.env` 或根目录 `.env` 配置：

```bash
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

## 数据存储

- `data/vector_db.pkl`: 向量嵌入数据库
- `data/ideas_db.pkl`: 想法元数据

## 测试

```bash
cd tests
python test_rag.py          # 测试 RAG 功能
python test_api_speed.py    # 测试 API 性能
python diagnose.py          # 系统诊断
```

## 依赖

- Flask: Web 框架
- flask-cors: CORS 支持
- openai: OpenAI API 客户端
- numpy: 向量计算
- python-dotenv: 环境变量管理
