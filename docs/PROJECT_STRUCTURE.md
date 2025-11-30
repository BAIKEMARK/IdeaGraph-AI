# 项目结构说明

## 目录组织

```
IdeaGraph-AI/
├── backend/              # 后端服务
│   ├── data/            # 数据存储（.pkl 文件）
│   ├── tests/           # 测试脚本
│   ├── app.py           # Flask 主应用
│   ├── requirements.txt # Python 依赖
│   └── .env.example     # 环境变量示例
│
├── components/          # React 组件
│   ├── ChatPanel.tsx    # 聊天面板
│   ├── GraphView.tsx    # 图谱可视化
│   ├── IdeaList.tsx     # 想法列表
│   └── RelatedIdeas.tsx # 相关想法
│
├── services/            # 前端服务层
│   └── geminiService.ts # API 调用服务
│
├── contexts/            # React Context
│   └── LanguageContext.tsx # 多语言支持
│
├── i18n/               # 国际化
│   └── translations.ts  # 翻译文件
│
├── docs/               # 项目文档
│   ├── API_CONFIGURATION.md
│   ├── QUICKSTART.md
│   └── GRAPH_RAG_GUIDE.md
│
├── scripts/            # 工具脚本
│   ├── start-backend.bat
│   ├── start-backend.sh
│   └── diagnose-frontend.html
│
├── App.tsx             # 主应用组件
├── index.tsx           # 入口文件
├── types.ts            # TypeScript 类型定义
├── constants.ts        # 常量配置
└── vite.config.ts      # Vite 配置
```

## 核心文件说明

### 后端 (backend/)

- **app.py**: Flask 应用主文件，包含所有 API 端点
  - `/api/distill`: 提炼想法
  - `/api/save_idea`: 保存想法到向量数据库
  - `/api/search_similar`: 搜索相似想法
  - `/api/chat`: AI 对话
  - `/api/get_all_ideas`: 获取所有想法
  - `/api/health`: 健康检查

- **data/**: 存储向量数据库文件
  - `vector_db.pkl`: 向量嵌入
  - `ideas_db.pkl`: 想法数据

- **tests/**: 测试和诊断脚本
  - `test_rag.py`: RAG 功能测试
  - `test_api_speed.py`: API 性能测试
  - `diagnose.py`: 系统诊断

### 前端

- **App.tsx**: 主应用组件，管理状态和布局
- **components/**: 可复用的 React 组件
- **services/geminiService.ts**: 封装所有后端 API 调用
- **types.ts**: TypeScript 类型定义
- **contexts/LanguageContext.tsx**: 多语言状态管理

## 数据流

1. 用户输入 → `App.tsx`
2. 调用 `geminiService.distillIdeaFromText()`
3. 后端 `/api/distill` 处理
4. 返回结构化数据 + 向量嵌入
5. 保存到向量数据库
6. 更新 UI 显示

## 开发指南

### 添加新功能

1. **后端 API**: 在 `backend/app.py` 添加新路由
2. **前端服务**: 在 `services/geminiService.ts` 添加调用函数
3. **UI 组件**: 在 `components/` 创建新组件
4. **类型定义**: 在 `types.ts` 添加类型

### 测试

- 后端测试: `backend/tests/` 目录
- 运行测试: `python backend/tests/test_*.py`

### 部署

1. 构建前端: `npm run build`
2. 启动后端: `python backend/app.py`
3. 配置环境变量: `.env` 文件
