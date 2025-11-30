# 快速开始 - Graph RAG 功能

## 安装依赖

### 后端
```bash
pip install -r backend/requirements.txt
```

### 前端
```bash
npm install
```

## 配置 API

复制 `.env.example` 到 `.env.local` 并填入你的 API 密钥：

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

EMBEDDING_API_KEY=your_api_key_here
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## 启动应用

### 1. 启动后端（终端 1）
```bash
python backend/app.py
```

后端将运行在 `http://localhost:5000`

### 2. 启动前端（终端 2）
```bash
npm run dev
```

前端将运行在 `http://localhost:5173`

## 测试 Graph RAG

### 方法 1: 使用测试脚本
```bash
python backend/test_rag.py
```

这将测试：
- ✅ 后端健康检查
- ✅ 想法提炼和 embedding 生成
- ✅ 向量数据库保存
- ✅ 相似度搜索
- ✅ RAG 增强对话

### 方法 2: 在浏览器中测试

1. **创建第一个想法**
   - 在左侧输入框输入：
     ```
     区块链技术通过去中心化的方式，让用户掌握自己的数字身份，
     不再依赖 Google 或 Facebook 等中心化平台。
     ```
   - 点击"捕获"按钮
   - 观察生成的知识图谱

2. **创建第二个想法**
   - 输入相关主题：
     ```
     Web3 应用使用智能合约来实现去信任的交易，
     用户可以直接点对点交互，无需中介。
     ```
   - 点击"捕获"

3. **查看相关想法**
   - 选择任一想法
   - 右侧面板顶部会显示"相关灵感"
   - 显示相似度百分比

4. **测试 RAG 对话**
   - 在聊天框输入：
     ```
     这个想法和其他概念有什么联系？
     ```
   - AI 会引用相关想法和图结构回答

## 验证 RAG 是否工作

### 检查向量数据库文件
```bash
# 应该看到这两个文件
ls backend/vector_db.pkl
ls backend/ideas_db.pkl
```

### 查看后端日志
后端会输出相似度搜索结果，例如：
```
Found 2 similar ideas for current idea
Similarity scores: [0.87, 0.72]
```

### 前端界面验证
- ✅ 右侧面板显示"相关灵感"
- ✅ 显示相似度百分比（如 87%）
- ✅ 对话时 AI 提到相关想法

## 常见问题

### Q: 相关想法不显示？
A: 至少需要 2 个想法才能进行相似度搜索

### Q: 向量数据库文件在哪？
A: 在 `backend/` 目录下，自动创建

### Q: 如何清空数据库？
A: 删除 `vector_db.pkl` 和 `ideas_db.pkl` 文件

### Q: 支持哪些 API？
A: 任何 OpenAI 兼容的 API：
- OpenAI
- Azure OpenAI
- 本地模型（Ollama, LM Studio）
- 其他提供商（DeepSeek, Moonshot 等）

## 下一步

- 📖 阅读 [GRAPH_RAG_GUIDE.md](GRAPH_RAG_GUIDE.md) 了解实现细节
- 🔧 查看 [API_CONFIGURATION.md](API_CONFIGURATION.md) 配置不同的 API
- 🚀 开始捕获你的想法，构建知识图谱！
