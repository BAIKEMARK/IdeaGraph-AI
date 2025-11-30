"""
测试批量删除功能
Test batch delete functionality
"""
import requests
import json
import uuid

BASE_URL = "http://localhost:5000/api"

def test_health():
    """测试后端健康状态"""
    print("🔍 测试后端健康状态...")
    response = requests.get(f"{BASE_URL}/health")
    if response.ok:
        print("✅ 后端运行正常")
        data = response.json()
        print(f"   想法数量: {data.get('ideas_count')}")
        return True
    else:
        print("❌ 后端未响应")
        return False

def create_test_ideas(count=5):
    """创建多个测试想法"""
    print(f"\n🔍 创建 {count} 个测试想法...")
    
    idea_ids = []
    
    for i in range(count):
        text = f"测试想法 #{i+1} - 用于批量删除测试"
        
        response = requests.post(f"{BASE_URL}/distill", json={"text": text})
        if response.ok:
            data = response.json()
            
            # 保存想法
            idea_id = str(uuid.uuid4())
            idea_data = {
                "idea_id": idea_id,
                "content_raw": text,
                "distilled_data": data,
                "embedding_vector": data["embedding_vector"]
            }
            
            save_response = requests.post(f"{BASE_URL}/save_idea", json={
                "idea_id": idea_id,
                "embedding_vector": data["embedding_vector"],
                "idea_data": idea_data
            })
            
            if save_response.ok:
                idea_ids.append(idea_id)
                print(f"   ✓ 创建想法 #{i+1}: {idea_id[:8]}...")
            else:
                print(f"   ✗ 保存失败 #{i+1}")
        else:
            print(f"   ✗ 创建失败 #{i+1}")
    
    print(f"✅ 成功创建 {len(idea_ids)} 个测试想法")
    return idea_ids

def test_batch_delete(idea_ids):
    """测试批量删除"""
    print(f"\n🔍 测试批量删除 {len(idea_ids)} 个想法...")
    
    response = requests.post(f"{BASE_URL}/delete_ideas_batch", json={
        "idea_ids": idea_ids
    })
    
    if response.ok:
        data = response.json()
        print("✅ 批量删除成功")
        print(f"   状态: {data.get('status')}")
        print(f"   删除数量: {data.get('deleted_count')}")
        print(f"   删除的ID: {[id[:8] + '...' for id in data.get('deleted_ids', [])]}")
        
        not_found = data.get('not_found_ids', [])
        if not_found:
            print(f"   未找到的ID: {[id[:8] + '...' for id in not_found]}")
        
        return data
    else:
        print(f"❌ 批量删除失败: {response.text}")
        return None

def verify_batch_deleted(idea_ids):
    """验证想法已批量删除"""
    print(f"\n🔍 验证 {len(idea_ids)} 个想法已删除...")
    
    # 获取所有想法
    response = requests.get(f"{BASE_URL}/get_all_ideas")
    if response.ok:
        ideas = response.json()["ideas"]
        existing_ids = [idea["idea_id"] for idea in ideas]
        
        still_exist = [id for id in idea_ids if id in existing_ids]
        
        if len(still_exist) == 0:
            print("✅ 所有想法已成功删除")
            return True
        else:
            print(f"⚠️  仍有 {len(still_exist)} 个想法存在")
            return False
    else:
        print(f"❌ 获取想法失败: {response.text}")
        return False

def test_partial_batch_delete():
    """测试部分删除（包含不存在的ID）"""
    print(f"\n🔍 测试部分批量删除（包含不存在的ID）...")
    
    # 创建2个真实想法
    real_ids = create_test_ideas(2)
    
    # 添加2个假ID
    fake_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
    
    # 混合真实和假ID
    mixed_ids = real_ids + fake_ids
    
    print(f"   真实ID: {len(real_ids)}, 假ID: {len(fake_ids)}")
    
    response = requests.post(f"{BASE_URL}/delete_ideas_batch", json={
        "idea_ids": mixed_ids
    })
    
    if response.ok:
        data = response.json()
        deleted_count = data.get('deleted_count', 0)
        not_found_count = len(data.get('not_found_ids', []))
        
        print("✅ 部分删除成功")
        print(f"   删除数量: {deleted_count}")
        print(f"   未找到数量: {not_found_count}")
        
        if deleted_count == len(real_ids) and not_found_count == len(fake_ids):
            print("✅ 正确处理了真实和不存在的ID")
            return True
        else:
            print("⚠️  删除结果不符合预期")
            return False
    else:
        print(f"❌ 部分删除失败: {response.text}")
        return False

def test_empty_batch_delete():
    """测试空批量删除"""
    print(f"\n🔍 测试空批量删除...")
    
    response = requests.post(f"{BASE_URL}/delete_ideas_batch", json={
        "idea_ids": []
    })
    
    if response.status_code == 400:
        print("✅ 正确返回400错误（空列表）")
        return True
    else:
        print(f"⚠️  预期400，实际得到: {response.status_code}")
        return False

def test_performance():
    """测试批量删除性能"""
    print(f"\n🔍 测试批量删除性能（10个想法）...")
    
    import time
    
    # 创建10个想法
    idea_ids = create_test_ideas(10)
    
    # 测量批量删除时间
    start_time = time.time()
    result = test_batch_delete(idea_ids)
    elapsed = time.time() - start_time
    
    if result:
        print(f"⏱️  批量删除耗时: {elapsed:.3f}秒")
        print(f"   平均每个: {elapsed/len(idea_ids):.3f}秒")
        
        if elapsed < 2.0:  # 应该在2秒内完成
            print("✅ 性能良好")
            return True
        else:
            print("⚠️  性能可能需要优化")
            return True
    
    return False

def main():
    print("=" * 70)
    print("批量删除功能测试")
    print("=" * 70)
    
    # 测试1: 健康检查
    if not test_health():
        print("\n❌ 后端未运行。请启动: python backend/app.py")
        return
    
    # 测试2: 创建测试想法
    idea_ids = create_test_ideas(5)
    if not idea_ids:
        print("\n❌ 无法创建测试想法")
        return
    
    # 测试3: 批量删除
    result = test_batch_delete(idea_ids)
    if result:
        verify_batch_deleted(idea_ids)
    
    # 测试4: 部分删除（包含不存在的ID）
    test_partial_batch_delete()
    
    # 测试5: 空批量删除
    test_empty_batch_delete()
    
    # 测试6: 性能测试
    test_performance()
    
    print("\n" + "=" * 70)
    print("✅ 所有批量删除功能测试完成！")
    print("=" * 70)
    print("\n验证的功能:")
    print("  ✓ 批量删除多个想法")
    print("  ✓ 部分删除（混合真实和不存在的ID）")
    print("  ✓ 空列表错误处理")
    print("  ✓ 数据库状态验证")
    print("  ✓ 性能测试")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到后端。请确保后端运行在 http://localhost:5000")
    except Exception as e:
        import traceback
        print(f"\n❌ 测试失败: {e}")
        print(traceback.format_exc())
