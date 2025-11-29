# IdeaGraph AI

一个基于 AI 的想法管理和可视化工具，使用知识图谱和 RAG 技术帮助你捕捉、整理和探索创意。

## 快速开始

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd backend
pip install -r requirements.txt
```

### 2. 配置 API

复制 `.env.example` 到 `.env` 并填入你的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### 3. 启动应用

```bash
# 启动后端（在 backend 目录）
python app.py

# 启动前端（在根目录）
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
├── backend/           # Flask 后端
│   ├── data/         # 数据库文件
│   ├── tests/        # 测试脚本
│   └── app.py        # 主应用
├── components/       # React 组件
├── services/         # API 服务
├── docs/            # 文档
└── scripts/         # 工具脚本
```

## 功能特性

- 🧠 AI 驱动的想法提炼和结构化
- 📊 交互式知识图谱可视化
- 🔍 基于向量相似度的相关想法推荐
- 💬 上下文感知的 AI 对话助手
- 🌐 多语言支持（中文/英文）

## 技术栈

- **前端**: React + TypeScript + Vite + D3.js
- **后端**: Flask + OpenAI API + NumPy
- **存储**: 向量数据库（Pickle）

## 文档

详细文档请查看 `docs/` 目录：
- [API 配置](docs/API_CONFIGURATION.md)
- [快速开始指南](docs/QUICKSTART.md)
- [知识图谱指南](docs/GRAPH_RAG_GUIDE.md)

## License

MIT
