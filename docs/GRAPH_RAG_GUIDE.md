# Graph RAG 实现指南

## 已实现的功能

### 1. 向量数据库（本地实现）
- **存储位置**: `vector_db.pkl` 和 `ideas_db.pkl`
- **技术**: 使用 numpy + pickle 实现简单的向量存储
- **功能**: 
  - 保存想法的 embedding 向量
  - 余弦相似度搜索
  - 自动持久化到磁盘

### 2. 相似度检索
- **算法**: 余弦相似度（Cosine Similarity）
- **API**: `/api/search_similar`
- **参数**:
  - `query_embedding`: 查询向量
  - `top_k`: 返回前 K 个相似结果（默认 3）
  - `exclude_id`: 排除当前想法

### 3. 图遍历
- **功能**: 从知识图谱中提取关键概念和关系
- **实现**: `traverse_graph()` 函数
- **输出**:
  - 节点列表（概念、工具、人物等）
  - 边列表（关系描述）

### 4. RAG 增强对话
- **API**: `/api/chat`（已升级）
- **上下文来源**:
  1. 当前想法的摘要和标签
  2. 相似想法（通过向量检索）
  3. 图结构中的关键概念和关系
- **效果**: AI 助手能够基于相关知识提供更准确的回答

## 使用流程

### 创建想法
```typescript
// 1. 用户输入原始文本
const text = "区块链如何实现去中心化身份认证";

// 2. 后端提炼结构化数据 + 生成 embedding
const distilledData = await distillIdeaFromText(text);

// 3. 保存到向量数据库
await saveIdeaToVectorDB(ideaId, embedding, ideaData);
```

### 查找相关想法
```typescript
// 使用当前想法的 embedding 搜索相似内容
const similar = await searchSimilarIdeas(
  currentIdea.embedding_vector,
  3,  // 返回前 3 个
  currentIdea.idea_id  // 排除自己
);
```

### RAG 对话
```typescript
// 对话时自动包含：
// - 当前想法的上下文
// - 相似想法（相似度 > 阈值）
// - 图结构中的关键概念
const reply = await chatWithIdea(history, currentIdea);
```

## 数据结构

### 向量数据库
```python
# vector_db.pkl
{
  "idea_id_1": np.array([0.1, 0.2, ...]),  # embedding 向量
  "idea_id_2": np.array([0.3, 0.4, ...]),
}

# ideas_db.pkl
{
  "idea_id_1": {
    "idea_id": "...",
    "content_raw": "...",
    "distilled_data": {...},
    "embedding_vector": [...]
  }
}
```

### 相似度搜索结果
```json
{
  "results": [
    {
      "idea_id": "abc123",
      "similarity": 0.87,
      "idea_data": {
        "distilled_data": {
          "one_liner": "...",
          "tags": ["tag1", "tag2"]
        }
      }
    }
  ]
}
```

## 前端展示

### RelatedIdeas 组件
- 自动加载相关想法
- 显示相似度百分比
- 点击跳转到相关想法

### 位置
- 右侧面板顶部
- 聊天工作台上方

## 性能优化建议

### 当前实现（适合小规模）
- ✅ 简单易用，无需额外依赖
- ✅ 数据持久化到本地文件
- ⚠️ 线性搜索，数据量大时较慢

### 未来升级（大规模数据）
如果想法数量超过 1000 个，建议升级到：
- **ChromaDB**: 轻量级向量数据库
- **FAISS**: Facebook 的高性能向量检索库
- **Qdrant**: 生产级向量搜索引擎

## 测试步骤

1. **启动后端**
   ```bash
   python backend/app.py
   ```

2. **创建多个想法**
   - 输入不同主题的文本
   - 观察自动生成的图结构

3. **查看相关想法**
   - 选择一个想法
   - 右侧面板会显示相似的想法

4. **测试 RAG 对话**
   - 在聊天框询问问题
   - AI 会引用相关想法和图结构

## 示例对话

**用户**: "这个想法和其他概念有什么联系？"

**AI（使用 RAG）**: 
```
根据知识图谱，这个想法与以下概念相关：

1. [去中心化身份] (相似度: 87%)
   - 共同标签: Web3, Privacy
   - 关系: 都涉及用户数据所有权

2. 关键概念: Blockchain, Data Ownership, Intermediaries
3. 核心关系: DID powered_by Blockchain; DID disrupts Intermediaries

这些想法共同构成了一个关于数据主权的知识网络...
```

## 故障排查

### 向量数据库文件未创建
- 确保后端有写入权限
- 检查 `backend/` 目录

### 相似度搜索无结果
- 确认至少有 2 个想法
- 检查 embedding 是否正确生成

### 对话没有使用 RAG
- 查看后端日志
- 确认 `embedding_vector` 字段存在
