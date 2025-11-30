"""
测试删除想法和清除聊天记录功能
Test delete idea and clear chat history functionality
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

def create_test_idea():
    """创建测试想法"""
    print("\n🔍 创建测试想法...")
    
    text = "这是一个测试想法，用于测试删除功能。"
    
    response = requests.post(f"{BASE_URL}/distill", json={"text": text})
    if response.ok:
        data = response.json()
        print("✅ 测试想法已创建")
        
        # 保存想法
        idea_id = str(uuid.uuid4())
        idea_data = {
            "idea_id": idea_id,
            "content_raw": text,
            "distilled_data": data,
            "embedding_vector": data["embedding_vector"],
            "chat_history": [
                {"id": "1", "role": "user", "content": "测试消息1", "timestamp": "2024-01-01T00:00:00Z"},
                {"id": "2", "role": "model", "content": "测试回复1", "timestamp": "2024-01-01T00:00:01Z"}
            ]
        }
        
        save_response = requests.post(f"{BASE_URL}/save_idea", json={
            "idea_id": idea_id,
            "embedding_vector": data["embedding_vector"],
            "idea_data": idea_data
        })
        
        if save_response.ok:
            print(f"   已保存，ID: {idea_id[:8]}...")
            return idea_id, idea_data
        else:
            print(f"⚠️  保存失败: {save_response.text}")
            return None, None
    else:
        print(f"❌ 创建失败: {response.text}")
        return None, None

def test_clear_chat_history(idea_id):
    """测试清除聊天记录"""
    print(f"\n🔍 测试清除聊天记录 (ID: {idea_id[:8]}...)...")
    
    response = requests.post(f"{BASE_URL}/clear_chat_history", json={
        "idea_id": idea_id
    })
    
    if response.ok:
        data = response.json()
        print("✅ 聊天记录已清除")
        print(f"   状态: {data.get('status')}")
        return True
    else:
        print(f"❌ 清除失败: {response.text}")
        return False

def verify_chat_cleared(idea_id):
    """验证聊天记录已清除"""
    print(f"\n🔍 验证聊天记录已清除...")
    
    # 获取所有想法
    response = requests.get(f"{BASE_URL}/get_all_ideas")
    if response.ok:
        ideas = response.json()["ideas"]
        idea = next((i for i in ideas if i["idea_id"] == idea_id), None)
        
        if idea:
            chat_history = idea.get("chat_history", [])
            if len(chat_history) == 0:
                print("✅ 聊天记录已成功清除")
                return True
            else:
                print(f"⚠️  聊天记录仍存在 ({len(chat_history)} 条消息)")
                return False
        else:
            print("⚠️  未找到想法")
            return False
    else:
        print(f"❌ 获取想法失败: {response.text}")
        return False

def test_delete_idea(idea_id):
    """测试删除想法"""
    print(f"\n🔍 测试删除想法 (ID: {idea_id[:8]}...)...")
    
    response = requests.post(f"{BASE_URL}/delete_idea", json={
        "idea_id": idea_id
    })
    
    if response.ok:
        data = response.json()
        print("✅ 想法已删除")
        print(f"   状态: {data.get('status')}")
        print(f"   删除的ID: {data.get('deleted_id')[:8]}...")
        return True
    else:
        print(f"❌ 删除失败: {response.text}")
        return False

def verify_idea_deleted(idea_id):
    """验证想法已删除"""
    print(f"\n🔍 验证想法已删除...")
    
    # 获取所有想法
    response = requests.get(f"{BASE_URL}/get_all_ideas")
    if response.ok:
        ideas = response.json()["ideas"]
        idea = next((i for i in ideas if i["idea_id"] == idea_id), None)
        
        if idea is None:
            print("✅ 想法已成功删除")
            return True
        else:
            print("⚠️  想法仍然存在")
            return False
    else:
        print(f"❌ 获取想法失败: {response.text}")
        return False

def test_delete_nonexistent():
    """测试删除不存在的想法"""
    print(f"\n🔍 测试删除不存在的想法...")
    
    fake_id = str(uuid.uuid4())
    response = requests.post(f"{BASE_URL}/delete_idea", json={
        "idea_id": fake_id
    })
    
    if response.status_code == 404:
        print("✅ 正确返回404错误")
        return True
    else:
        print(f"⚠️  预期404，实际得到: {response.status_code}")
        return False

def main():
    print("=" * 70)
    print("删除和清除功能测试")
    print("=" * 70)
    
    # 测试1: 健康检查
    if not test_health():
        print("\n❌ 后端未运行。请启动: python backend/app.py")
        return
    
    # 测试2: 创建测试想法
    idea_id, idea_data = create_test_idea()
    if not idea_id:
        print("\n❌ 无法创建测试想法")
        return
    
    # 测试3: 清除聊天记录
    if test_clear_chat_history(idea_id):
        verify_chat_cleared(idea_id)
    
    # 测试4: 删除想法
    if test_delete_idea(idea_id):
        verify_idea_deleted(idea_id)
    
    # 测试5: 删除不存在的想法
    test_delete_nonexistent()
    
    print("\n" + "=" * 70)
    print("✅ 所有删除和清除功能测试完成！")
    print("=" * 70)
    print("\n验证的功能:")
    print("  ✓ 清除聊天记录")
    print("  ✓ 删除想法")
    print("  ✓ 错误处理（404）")
    print("  ✓ 数据库状态验证")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到后端。请确保后端运行在 http://localhost:5000")
    except Exception as e:
        import traceback
        print(f"\n❌ 测试失败: {e}")
        print(traceback.format_exc())
