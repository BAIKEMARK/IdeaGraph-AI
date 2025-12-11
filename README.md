# IdeaGraph AI

<div align="center">

![IdeaGraph AI](https://img.shields.io/badge/IdeaGraph-AI-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)

**🧠 AI 驱动的智能想法管理平台**

将零散的想法转化为结构化的知识图谱，通过 AI 助手探索创意之间的深层联系

[快速开始](#快速开始) • [功能特性](#功能特性) • [使用指南](#使用指南) • [技术栈](#技术栈)

</div>

---

## 🌟 产品亮点

### 🎯 智能想法提炼
- 输入任何想法，AI 自动提取核心概念和关键词
- 生成结构化的知识图谱，展现想法的内在逻辑
- 支持中英文双语，适应不同使用场景

### 🔗 可视化知识网络
- **宏观视图**：鸟瞰所有想法的关联关系
- **微观视图**：深入探索单个想法的详细结构
- 交互式图谱操作，直观理解复杂概念

### 🤖 AI 对话助手
- 基于 RAG 技术的上下文感知对话
- 帮助深化思考，发现新的创意方向
- 智能推荐相关想法，激发灵感碰撞

### ⚡ 想法进化工具
- **合并**：将相关想法融合成更完整的概念
- **拆分**：将复杂想法分解为可执行的子概念
- **精炼**：通过 AI 反馈不断优化想法表达

---

## 快速开始

### 📋 环境要求

- Node.js 18+ 
- Python 3.8+
- OpenAI API 密钥（或兼容的 LLM API）

### 🔧 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/ideagraph-ai.git
   cd ideagraph-ai
   ```

2. **安装依赖**
   ```bash
   # 前端依赖
   npm install
   
   # 后端依赖
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **配置 API**
   ```bash
   # 复制配置文件
   cp config/.env.example config/.env
   ```
   
   编辑 `config/.env` 文件：
   ```env
   LLM_API_KEY=your_openai_api_key_here
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   ```

4. **启动应用**
   ```bash
   # 启动后端服务（新终端窗口）
   cd backend && python app.py
   
   # 启动前端服务（新终端窗口）
   npm run dev
   ```

5. **开始使用**
   
   打开浏览器访问 http://localhost:3000

---

## 功能特性

### 🎨 核心功能

| 功能 | 描述 | 状态 |
|------|------|------|
| 🧠 AI 想法提炼 | 自动分析和结构化原始想法 | ✅ |
| 📊 知识图谱可视化 | D3.js 驱动的交互式图谱 | ✅ |
| 🔍 相似想法推荐 | 基于向量相似度的智能推荐 | ✅ |
| 💬 AI 对话助手 | 上下文感知的创意探索 | ✅ |
| 🌐 多语言支持 | 中文/英文界面切换 | ✅ |
| 🔄 想法进化 | 合并、拆分、精炼操作 | ✅ |
| 📱 响应式设计 | 适配桌面和移动设备 | ✅ |

### 🎯 使用场景

- **📝 创意写作**：整理写作灵感，构建故事框架
- **🔬 学术研究**：梳理研究思路，发现知识关联
- **💼 产品规划**：收集需求想法，形成产品路线图
- **🎓 学习笔记**：构建知识体系，加深理解记忆
- **🚀 创业思考**：验证商业想法，探索市场机会

---

## 使用指南

### 🎬 快速上手

1. **捕获想法**
   - 在左侧输入框中描述你的想法
   - 点击"捕获想法"，AI 会自动分析并生成知识图谱

2. **探索关联**
   - 在宏观视图中查看所有想法的关系网络
   - 点击想法节点进入微观视图，查看详细结构

3. **AI 对话**
   - 选择想法后，在右侧聊天面板与 AI 深入讨论
   - AI 会基于你的想法库提供个性化建议

4. **想法进化**
   - 使用底部工具栏的合并、拆分、精炼功能
   - 不断优化和发展你的想法

### 💡 使用技巧

- **批量操作**：按住 Ctrl/Cmd 多选想法进行批量管理
- **快捷键**：按 ESC 键快速返回宏观视图
- **相似度调节**：调整相似度阈值控制图谱连接密度
- **多语言**：点击右上角语言按钮切换界面语言

---

## 技术栈

### 前端技术
- **React 19** - 现代化 UI 框架
- **TypeScript** - 类型安全的开发体验
- **Vite** - 快速的构建工具
- **D3.js** - 强大的数据可视化库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Framer Motion** - 流畅的动画效果

### 后端技术
- **Flask** - 轻量级 Python Web 框架
- **NumPy** - 高性能数值计算
- **OpenAI API** - 先进的语言模型服务
- **向量数据库** - 高效的相似度搜索

### 开发工具
- **Vitest** - 现代化测试框架
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

---

## 📚 文档

- 📖 [快速开始指南](docs/guides/QUICKSTART.md) - 详细的安装和配置说明
- 🔧 [API 配置](docs/api/API_CONFIGURATION.md) - LLM API 配置指南
- 🧠 [知识图谱指南](docs/guides/GRAPH_RAG_GUIDE.md) - 深入了解 RAG 技术原理
- 🚀 [部署指南](docs/guides/DEPLOYMENT.md) - 生产环境部署说明

---

## 🤝 贡献

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

### 🐛 问题反馈

如果你发现了 bug 或有功能建议，请：
1. 查看 [Issues](https://github.com/your-username/ideagraph-ai/issues) 是否已有相关讨论
2. 创建新的 Issue 并详细描述问题或建议
3. 我们会尽快回复并处理

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。你可以自由使用、修改和分发本软件。

---

## 🌟 支持项目

如果这个项目对你有帮助，请考虑：

- ⭐ 给项目点个 Star
- 🐛 报告 Bug 或提出改进建议
- 🔀 提交 Pull Request
- 📢 分享给更多人

---

<div align="center">

**让每个想法都闪闪发光 ✨**

Made with ❤️ by IdeaGraph AI Team

</div>