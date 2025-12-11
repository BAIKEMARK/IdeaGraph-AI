# IdeaGraph AI

<div align="center">

![IdeaGraph AI](https://img.shields.io/badge/IdeaGraph-AI-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)

**🧠 AI-Powered Intelligent Idea Management Platform**

Transform scattered thoughts into structured knowledge graphs and explore deep connections between ideas with AI assistance

[Quick Start](#quick-start) • [Features](#features) • [Usage Guide](#usage-guide) • [Tech Stack](#tech-stack)

**Languages:** [English](README.md) | [中文](README_CN.md)

</div>

---

## 🌟 Product Highlights

### 🎯 Intelligent Idea Distillation
- Input any idea, AI automatically extracts core concepts and keywords
- Generate structured knowledge graphs showing the internal logic of ideas
- Support for both Chinese and English, adapting to different usage scenarios

### 🔗 Visual Knowledge Network
- **Macro View**: Bird's-eye view of relationships between all ideas
- **Micro View**: Deep exploration of detailed structure of individual ideas
- Interactive graph operations for intuitive understanding of complex concepts

### 🤖 AI Conversation Assistant
- Context-aware conversations based on RAG technology
- Help deepen thinking and discover new creative directions
- Intelligent recommendation of related ideas to spark inspiration

### ⚡ Idea Evolution Tools
- **Merge**: Combine related ideas into more complete concepts
- **Split**: Break down complex ideas into executable sub-concepts
- **Refine**: Continuously optimize idea expression through AI feedback

---

## Quick Start

### 📋 Requirements

- Node.js 18+ 
- Python 3.8+
- OpenAI API Key (or compatible LLM API)

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ideagraph-ai.git
   cd ideagraph-ai
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Configure API**
   ```bash
   # Copy configuration file
   cp config/.env.example config/.env
   ```
   
   Edit `config/.env` file:
   ```env
   LLM_API_KEY=your_openai_api_key_here
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   ```

4. **Start the application**
   ```bash
   # Start backend service (new terminal window)
   cd backend && python app.py
   
   # Start frontend service (new terminal window)
   npm run dev
   ```

5. **Start using**
   
   Open your browser and visit http://localhost:3000

---

## Features

### 🎨 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🧠 AI Idea Distillation | Automatically analyze and structure raw ideas | ✅ |
| 📊 Knowledge Graph Visualization | Interactive graphs powered by D3.js | ✅ |
| 🔍 Similar Idea Recommendations | Smart recommendations based on vector similarity | ✅ |
| 💬 AI Conversation Assistant | Context-aware creative exploration | ✅ |
| 🌐 Multi-language Support | Chinese/English interface switching | ✅ |
| 🔄 Idea Evolution | Merge, split, and refine operations | ✅ |
| 📱 Responsive Design | Compatible with desktop and mobile devices | ✅ |

### 🎯 Use Cases

- **📝 Creative Writing**: Organize writing inspiration and build story frameworks
- **🔬 Academic Research**: Sort research ideas and discover knowledge connections
- **💼 Product Planning**: Collect requirement ideas and form product roadmaps
- **🎓 Study Notes**: Build knowledge systems and deepen understanding
- **🚀 Entrepreneurial Thinking**: Validate business ideas and explore market opportunities

---

## Usage Guide

### 🎬 Getting Started

1. **Capture Ideas**
   - Describe your idea in the left input box
   - Click "Capture Idea", AI will automatically analyze and generate a knowledge graph

2. **Explore Connections**
   - View the relationship network of all ideas in the macro view
   - Click on idea nodes to enter micro view and see detailed structure

3. **AI Conversation**
   - After selecting an idea, have in-depth discussions with AI in the right chat panel
   - AI will provide personalized suggestions based on your idea library

4. **Idea Evolution**
   - Use merge, split, and refine functions in the bottom toolbar
   - Continuously optimize and develop your ideas

### 💡 Usage Tips

- **Batch Operations**: Hold Ctrl/Cmd to multi-select ideas for batch management
- **Shortcuts**: Press ESC key to quickly return to macro view
- **Similarity Adjustment**: Adjust similarity threshold to control graph connection density
- **Multi-language**: Click the language button in the top right to switch interface language

---

## Tech Stack

### Frontend Technologies
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development experience
- **Vite** - Fast build tool
- **D3.js** - Powerful data visualization library
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animation effects

### Backend Technologies
- **Flask** - Lightweight Python web framework
- **NumPy** - High-performance numerical computing
- **OpenAI API** - Advanced language model services
- **Vector Database** - Efficient similarity search

### Development Tools
- **Vitest** - Modern testing framework
- **ESLint** - Code quality checking
- **Prettier** - Code formatting

---

## 📚 Documentation

- 📖 [Quick Start Guide](docs/guides/QUICKSTART.md) - Detailed installation and configuration instructions
- 🔧 [API Configuration](docs/api/API_CONFIGURATION.md) - LLM API configuration guide
- 🧠 [Knowledge Graph Guide](docs/guides/GRAPH_RAG_GUIDE.md) - Deep dive into RAG technology principles
- 🚀 [Deployment Guide](docs/guides/DEPLOYMENT.md) - Production environment deployment instructions
- 🌍 [All Documentation](docs/README.md) - Complete documentation index in multiple languages

---

## 🤝 Contributing

We welcome all forms of contributions! Please check [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to participate in project development.

### 🐛 Issue Reporting

If you find bugs or have feature suggestions, please:
1. Check [Issues](https://github.com/your-username/ideagraph-ai/issues) for existing discussions
2. Create a new Issue with detailed description of the problem or suggestion
3. We will respond and handle it as soon as possible

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software.

---

## 🌟 Support the Project

If this project helps you, please consider:

- ⭐ Give the project a Star
- 🐛 Report bugs or suggest improvements
- 🔀 Submit Pull Requests
- 📢 Share with more people

---

<div align="center">

**Let every idea shine ✨**

Made with ❤️ by IdeaGraph AI Team

</div>