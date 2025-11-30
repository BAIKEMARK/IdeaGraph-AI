# 快速参考

## 🚀 启动命令

```bash
# 后端
cd backend && python app.py

# 前端
npm run dev

# 或使用脚本
./scripts/start-backend.sh  # Linux/Mac
scripts\start-backend.bat   # Windows
```

## 📁 重要目录

| 目录 | 说明 |
|------|------|
| `backend/` | Flask 后端服务 |
| `backend/data/` | 数据库文件 (.pkl) |
| `backend/tests/` | 测试脚本 |
| `components/` | React 组件 |
| `services/` | API 调用服务 |
| `docs/` | 项目文档 |
| `scripts/` | 工具脚本 |

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run build            # 构建生产版本
npm run type-check       # TypeScript 类型检查

# 测试
cd backend/tests
python test_rag.py       # 测试 RAG 功能
python test_api_speed.py # 测试 API 性能
```

## 📝 配置文件

- `.env` - 环境变量（API 密钥）
- `package.json` - 前端依赖
- `backend/requirements.txt` - 后端依赖
- `tsconfig.json` - TypeScript 配置
- `vite.config.ts` - Vite 配置

## 🔑 环境变量

```bash
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

## 📚 文档

- [README.md](README.md) - 项目介绍
- [CONTRIBUTING.md](CONTRIBUTING.md) - 开发指南
- [docs/INDEX.md](docs/INDEX.md) - 文档索引
- [docs/QUICKSTART.md](docs/QUICKSTART.md) - 快速开始
- [backend/README.md](backend/README.md) - 后端 API

## 🐛 调试

```bash
# 检查后端健康状态
curl http://localhost:5000/api/health

# 查看后端日志
cd backend && python app.py  # 查看控制台输出

# 前端调试
# 打开浏览器开发者工具 (F12)
```

## 📦 依赖安装

```bash
# 前端
npm install

# 后端
cd backend
pip install -r requirements.txt
```

## 🎯 端口

- 前端: http://localhost:5173
- 后端: http://localhost:5000

## ⚡ 性能

- 想法提炼: ~2-3秒
- 相似搜索: <100ms
- AI 对话: ~1-2秒
