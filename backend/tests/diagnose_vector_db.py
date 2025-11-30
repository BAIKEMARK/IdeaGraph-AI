"""
诊断向量数据库的状态
"""
import pickle
import numpy as np
from pathlib import Path

# 数据库路径
BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
VECTOR_DB_PATH = DATA_DIR / "vector_db.pkl"
IDEAS_DB_PATH = DATA_DIR / "ideas_db.pkl"

def diagnose():
    print("=" * 60)
    print("向量数据库诊断")
    print("=" * 60)
    
    # 检查文件是否存在
    print(f"\n1. 文件存在性检查:")
    print(f"   Vector DB: {VECTOR_DB_PATH.exists()} - {VECTOR_DB_PATH}")
    print(f"   Ideas DB:  {IDEAS_DB_PATH.exists()} - {IDEAS_DB_PATH}")
    
    if not VECTOR_DB_PATH.exists() or not IDEAS_DB_PATH.exists():
        print("\n❌ 数据库文件不存在！")
        return
    
    # 加载数据库
    try:
        with open(VECTOR_DB_PATH, 'rb') as f:
            vectors = pickle.load(f)
        with open(IDEAS_DB_PATH, 'rb') as f:
            ideas = pickle.load(f)
        print("\n✅ 数据库加载成功")
    except Exception as e:
        print(f"\n❌ 加载数据库失败: {e}")
        return
    
    # 检查数据库内容
    print(f"\n2. 数据库内容:")
    print(f"   向量数量: {len(vectors)}")
    print(f"   想法数量: {len(ideas)}")
    
    # 检查 ID 一致性
    vector_ids = set(vectors.keys())
    idea_ids = set(ideas.keys())
    
    print(f"\n3. ID 一致性检查:")
    print(f"   向量 ID: {vector_ids}")
    print(f"   想法 ID: {idea_ids}")
    
    missing_in_ideas = vector_ids - idea_ids
    missing_in_vectors = idea_ids - vector_ids
    
    if missing_in_ideas:
        print(f"   ⚠️  有向量但没有想法数据的 ID: {missing_in_ideas}")
    if missing_in_vectors:
        print(f"   ⚠️  有想法但没有向量的 ID: {missing_in_vectors}")
    
    if not missing_in_ideas and not missing_in_vectors:
        print(f"   ✅ ID 完全一致")
    
    # 检查向量维度
    print(f"\n4. 向量维度检查:")
    dimensions = {}
    for idea_id, vec in vectors.items():
        vec_array = np.array(vec)
        dim = len(vec_array)
        if dim not in dimensions:
            dimensions[dim] = []
        dimensions[dim].append(idea_id)
    
    for dim, ids in dimensions.items():
        print(f"   维度 {dim}: {len(ids)} 个向量")
        if len(ids) <= 3:
            print(f"      IDs: {ids}")
    
    if len(dimensions) > 1:
        print(f"   ⚠️  警告：向量维度不一致！")
    else:
        print(f"   ✅ 所有向量维度一致")
    
    # 检查向量质量
    print(f"\n5. 向量质量检查:")
    for idea_id, vec in list(vectors.items())[:3]:  # 只检查前3个
        vec_array = np.array(vec)
        norm = np.linalg.norm(vec_array)
        has_nan = np.isnan(vec_array).any()
        has_inf = np.isinf(vec_array).any()
        
        print(f"   ID {idea_id[:8]}:")
        print(f"      维度: {len(vec_array)}")
        print(f"      范数: {norm:.4f}")
        print(f"      有 NaN: {has_nan}")
        print(f"      有 Inf: {has_inf}")
        print(f"      范围: [{vec_array.min():.4f}, {vec_array.max():.4f}]")
    
    # 检查想法数据结构
    print(f"\n6. 想法数据结构检查:")
    for idea_id, idea_data in list(ideas.items())[:2]:  # 只检查前2个
        print(f"   ID {idea_id[:8]}:")
        print(f"      Keys: {list(idea_data.keys())}")
        
        if 'distilled_data' in idea_data:
            distilled = idea_data['distilled_data']
            print(f"      One-liner: {distilled.get('one_liner', 'N/A')[:50]}...")
            print(f"      Tags: {distilled.get('tags', [])}")
            
            if 'graph_structure' in distilled:
                graph = distilled['graph_structure']
                print(f"      Nodes: {len(graph.get('nodes', []))}")
                print(f"      Edges: {len(graph.get('edges', []))}")
    
    # 测试相似度计算
    print(f"\n7. 相似度计算测试:")
    if len(vectors) >= 2:
        ids = list(vectors.keys())[:2]
        vec1 = np.array(vectors[ids[0]])
        vec2 = np.array(vectors[ids[1]])
        
        try:
            # 计算余弦相似度
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                print(f"   ⚠️  零向量检测到！")
                similarity = 0.0
            else:
                similarity = np.dot(vec1, vec2) / (norm1 * norm2)
                similarity = float(np.clip(similarity, -1.0, 1.0))
            
            print(f"   ID {ids[0][:8]} vs {ids[1][:8]}")
            print(f"   相似度: {similarity:.4f}")
            print(f"   ✅ 相似度计算成功")
            
        except Exception as e:
            print(f"   ❌ 相似度计算失败: {e}")
    else:
        print(f"   ⚠️  向量数量不足，无法测试")
    
    print("\n" + "=" * 60)
    print("诊断完成")
    print("=" * 60)

if __name__ == "__main__":
    diagnose()
