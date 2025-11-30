# 开发指南

## 开发环境设置

### 前置要求

- Node.js 18+
- Python 3.8+
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆仓库
git clone <repository-url>
cd IdeaGraph-AI

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd backend
pip install -r requirements.txt

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API 密钥
```

## 开发工作流

### 启动开发服务器

```bash
# 终端 1: 启动后端
cd backend
python app.py

# 终端 2: 启动前端
npm run dev
```

### 代码规范

- **TypeScript**: 使用严格模式，避免 `any` 类型
- **Python**: 遵循 PEP 8 规范
- **组件**: 使用函数式组件和 Hooks
- **命名**: 使用有意义的变量名

### 提交规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/工具变更
```

## 项目架构

### 前端架构

- **状态管理**: React Hooks (useState, useEffect)
- **路由**: 单页应用，无路由
- **样式**: Tailwind CSS
- **图表**: D3.js

### 后端架构

- **框架**: Flask
- **API**: RESTful
- **AI**: OpenAI-compatible API
- **存储**: Pickle (向量数据库)

## 测试

### 后端测试

```bash
cd backend/tests
python test_rag.py
python test_api_speed.py
```

### 前端测试

```bash
npm run build  # 检查构建错误
```

## 常见问题

### API 配置问题

如果遇到 API 错误，检查：
1. `.env` 文件是否正确配置
2. API 密钥是否有效
3. 网络连接是否正常

### 数据库问题

如果数据丢失：
1. 检查 `backend/data/` 目录
2. 确保 `.pkl` 文件存在
3. 重启后端服务

## 贡献流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 联系方式

如有问题，请提交 Issue 或联系维护者。
