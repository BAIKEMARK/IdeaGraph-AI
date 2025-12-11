# IdeaGraph AI - Backend API

Flask 后端服务，为 IdeaGraph AI 提供 AI 驱动的想法处理和 RAG 功能。

## 🚀 快速启动

```bash
cd backend
pip install -r requirements.txt
python app.py
```

服务将在 http://localhost:5000 启动

## 📡 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/distill` | POST | 提炼原始文本为结构化想法 |
| `/api/save_idea` | POST | 保存想法到向量数据库 |
| `/api/search_similar` | POST | 搜索相似想法 |
| `/api/chat` | POST | 与 AI 对话 |
| `/api/get_all_ideas` | GET | 获取所有想法 |
| `/api/health` | GET | 健康检查 |

## ⚙️ 环境配置

在项目根目录的 `config/.env` 文件中配置：

```env
LLM_API_KEY=your_openai_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

## 💾 数据存储

- `data/vector_db.pkl`: 向量嵌入数据库
- `data/ideas_db.pkl`: 想法元数据存储

## 🧪 测试

```bash
cd backend/tests
python test_rag.py          # 测试 RAG 功能
python test_api_speed.py    # 测试 API 性能
python diagnose.py          # 系统诊断
```

## 📦 主要依赖

- **Flask**: 轻量级 Web 框架
- **flask-cors**: 跨域资源共享支持
- **openai**: OpenAI API 客户端
- **numpy**: 高性能数值计算
- **python-dotenv**: 环境变量管理
