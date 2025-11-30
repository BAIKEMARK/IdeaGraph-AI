# 向量数据库修复总结

## 问题描述

`/api/search_similar` 端点返回 500 错误，导致前端无法搜索相似想法。

## 根本原因

向量数据库中存在**维度不一致**的问题：
- 3 个向量是 1024 维（可能来自 `text-embedding-3-small` 模型）
- 2 个向量是 4096 维（来自 `Qwen3-Embedding-8B` 模型）

当尝试计算不同维度向量之间的余弦相似度时，numpy 会抛出异常，导致 500 错误。

## 修复措施

### 1. 改进错误处理

在 `backend/app.py` 中添加了更好的错误处理：

**`cosine_similarity` 函数**：
- 添加零向量检测
- 添加结果裁剪到 [-1, 1] 范围
- 返回 float 类型

**`search_similar_ideas` 函数**：
- 添加维度匹配检查
- 添加详细的错误日志
- 跳过有问题的向量而不是整体失败
- 添加 try-except 保护每个向量的处理

**`search_similar` 端点**：
- 添加 traceback 打印
- 改进错误消息

### 2. 创建诊断工具

**`backend/tests/diagnose_vector_db.py`**：
- 检查数据库文件存在性
- 检查向量和想法数量
- 检查 ID 一致性
- **检查向量维度分布**（关键！）
- 检查向量质量（NaN、Inf、范数）
- 检查想法数据结构
- 测试相似度计算

### 3. 创建修复工具

**`backend/tests/fix_vector_dimensions.py`**：
- 检测维度不一致
- 使用当前配置的嵌入模型重新生成所有向量
- 自动备份原数据库
- 更新向量数据库和想法数据库
- 验证修复结果

### 4. 执行修复

运行修复脚本后：
```
✅ 修复成功！所有向量维度现在一致
  4096 维: 5 个向量
```

## 修复结果

- ✅ 所有向量现在都是 4096 维（统一使用 Qwen3-Embedding-8B）
- ✅ 向量质量良好（无 NaN、无 Inf、范数接近 1.0）
- ✅ ID 完全一致（向量和想法数据匹配）
- ✅ 相似度计算测试通过

## 预防措施

为了防止将来再次出现此问题：

1. **在保存向量时验证维度**：
   ```python
   # 在 add_to_vector_db 中添加
   if vectors:
       expected_dim = len(next(iter(vectors.values())))
       if len(embedding) != expected_dim:
           raise ValueError(f"Dimension mismatch: expected {expected_dim}, got {len(embedding)}")
   ```

2. **在 API 配置变更时提醒**：
   - 如果更改了 `EMBEDDING_MODEL`，应该重新生成所有向量
   - 或者使用不同的数据库文件

3. **定期运行诊断**：
   ```bash
   python backend/tests/diagnose_vector_db.py
   ```

4. **改进的错误处理**已经就位，即使出现维度不匹配，也会：
   - 记录警告而不是崩溃
   - 跳过有问题的向量
   - 返回部分结果而不是 500 错误

## 使用工具

### 诊断数据库
```bash
python backend/tests/diagnose_vector_db.py
```

### 修复维度不一致
```bash
python backend/tests/fix_vector_dimensions.py
```

### 恢复备份（如果需要）
```bash
cd backend/data
cp vector_db.pkl.backup vector_db.pkl
cp ideas_db.pkl.backup ideas_db.pkl
```

## 技术细节

### 余弦相似度计算

```python
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    # 处理零向量
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    # 计算余弦相似度
    similarity = np.dot(vec1, vec2) / (norm1 * norm2)
    
    # 裁剪到 [-1, 1] 处理浮点误差
    return float(np.clip(similarity, -1.0, 1.0))
```

### 维度检查

```python
# 在 search_similar_ideas 中
if len(query_vec) != len(vec):
    print(f"⚠️  Dimension mismatch for idea {idea_id}")
    continue  # 跳过而不是失败
```

## 结论

问题已完全解决。后端现在可以：
- ✅ 正确处理相似度搜索
- ✅ 优雅地处理错误情况
- ✅ 提供详细的诊断信息
- ✅ 支持一键修复维度问题

前端的 `/api/search_similar` 调用现在应该可以正常工作了。
