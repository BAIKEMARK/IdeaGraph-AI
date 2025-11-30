"""
修复向量维度不一致的问题
将所有向量重新生成为统一维度
"""
import pickle
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()
load_dotenv("../.env")

# 数据库路径
BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
VECTOR_DB_PATH = DATA_DIR / "vector_db.pkl"
IDEAS_DB_PATH = DATA_DIR / "ideas_db.pkl"

# API 配置
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY") or os.getenv("LLM_API_KEY")
EMBEDDING_BASE_URL = os.getenv("EMBEDDING_BASE_URL") or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

def fix_dimensions():
    print("=" * 60)
    print("修复向量维度不一致问题")
    print("=" * 60)
    
    if not EMBEDDING_API_KEY:
        print("❌ 错误：未配置 EMBEDDING_API_KEY")
        return
    
    # 初始化客户端
    client = OpenAI(
        api_key=EMBEDDING_API_KEY,
        base_url=EMBEDDING_BASE_URL
    )
    
    print(f"\n使用模型: {EMBEDDING_MODEL}")
    print(f"API URL: {EMBEDDING_BASE_URL}")
    
    # 加载数据库
    try:
        with open(VECTOR_DB_PATH, 'rb') as f:
            vectors = pickle.load(f)
        with open(IDEAS_DB_PATH, 'rb') as f:
            ideas = pickle.load(f)
        print(f"\n✅ 加载了 {len(vectors)} 个向量和 {len(ideas)} 个想法")
    except Exception as e:
        print(f"\n❌ 加载数据库失败: {e}")
        return
    
    # 检查维度
    dimensions = {}
    for idea_id, vec in vectors.items():
        dim = len(vec)
        if dim not in dimensions:
            dimensions[dim] = []
        dimensions[dim].append(idea_id)
    
    print(f"\n当前维度分布:")
    for dim, ids in dimensions.items():
        print(f"  {dim} 维: {len(ids)} 个向量")
    
    if len(dimensions) == 1:
        print("\n✅ 所有向量维度已经一致，无需修复")
        return
    
    # 重新生成所有向量
    print(f"\n开始重新生成向量...")
    new_vectors = {}
    
    for i, (idea_id, idea_data) in enumerate(ideas.items(), 1):
        try:
            content_raw = idea_data.get('content_raw', '')
            if not content_raw:
                print(f"  ⚠️  跳过 {idea_id[:8]} (无内容)")
                continue
            
            print(f"  [{i}/{len(ideas)}] 处理 {idea_id[:8]}...", end='')
            
            # 调用嵌入 API
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=content_raw
            )
            
            embedding = response.data[0].embedding
            new_vectors[idea_id] = embedding
            
            # 同时更新 idea_data 中的 embedding_vector
            idea_data['embedding_vector'] = embedding
            
            print(f" ✅ ({len(embedding)} 维)")
            
        except Exception as e:
            print(f" ❌ 失败: {e}")
            continue
    
    if not new_vectors:
        print("\n❌ 没有成功生成任何向量")
        return
    
    # 备份原数据库
    backup_vector_path = VECTOR_DB_PATH.with_suffix('.pkl.backup')
    backup_ideas_path = IDEAS_DB_PATH.with_suffix('.pkl.backup')
    
    print(f"\n备份原数据库...")
    with open(backup_vector_path, 'wb') as f:
        pickle.dump(vectors, f)
    with open(backup_ideas_path, 'wb') as f:
        pickle.dump(ideas, f)
    print(f"  ✅ 备份到 {backup_vector_path.name}")
    
    # 保存新数据库
    print(f"\n保存新数据库...")
    with open(VECTOR_DB_PATH, 'wb') as f:
        pickle.dump(new_vectors, f)
    with open(IDEAS_DB_PATH, 'wb') as f:
        pickle.dump(ideas, f)
    
    print(f"  ✅ 保存了 {len(new_vectors)} 个向量")
    
    # 验证新维度
    new_dimensions = {}
    for idea_id, vec in new_vectors.items():
        dim = len(vec)
        if dim not in new_dimensions:
            new_dimensions[dim] = 0
        new_dimensions[dim] += 1
    
    print(f"\n新维度分布:")
    for dim, count in new_dimensions.items():
        print(f"  {dim} 维: {count} 个向量")
    
    if len(new_dimensions) == 1:
        print("\n✅ 修复成功！所有向量维度现在一致")
    else:
        print("\n⚠️  警告：仍然存在维度不一致")
    
    print("\n" + "=" * 60)
    print("修复完成")
    print("=" * 60)

if __name__ == "__main__":
    fix_dimensions()
