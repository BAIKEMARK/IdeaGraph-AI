#!/usr/bin/env python3
"""
测试脚本：验证聊天历史的保存和加载
"""
import pickle
import json
from pathlib import Path

# 数据库路径
BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
IDEAS_DB_PATH = DATA_DIR / "ideas_db.pkl"

def test_chat_history():
    """测试聊天历史是否正确保存"""
    print("=" * 60)
    print("测试聊天历史保存和加载")
    print("=" * 60)
    
    if not IDEAS_DB_PATH.exists():
        print("❌ 数据库文件不存在")
        return
    
    # 加载数据库
    with open(IDEAS_DB_PATH, 'rb') as f:
        ideas = pickle.load(f)
    
    print(f"\n📊 数据库统计:")
    print(f"   总想法数: {len(ideas)}")
    
    # 检查每个想法的聊天历史
    ideas_with_history = 0
    total_messages = 0
    
    for idea_id, idea_data in ideas.items():
        chat_history = idea_data.get('chat_history', [])
        if chat_history:
            ideas_with_history += 1
            total_messages += len(chat_history)
            print(f"\n✅ 想法 {idea_id[:8]}...")
            print(f"   One-liner: {idea_data.get('distilled_data', {}).get('one_liner', 'N/A')}")
            print(f"   聊天消息数: {len(chat_history)}")
            
            # 显示前两条消息
            for i, msg in enumerate(chat_history[:2]):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')[:50]
                timestamp = msg.get('timestamp', 'N/A')
                print(f"   [{i+1}] {role}: {content}... (时间: {timestamp})")
    
    print(f"\n📈 聊天历史统计:")
    print(f"   有聊天历史的想法: {ideas_with_history}/{len(ideas)}")
    print(f"   总消息数: {total_messages}")
    
    if ideas_with_history == 0:
        print("\n⚠️  警告: 没有找到任何聊天历史！")
        print("   可能的原因:")
        print("   1. 还没有进行过聊天")
        print("   2. 聊天历史没有正确保存")
    else:
        print("\n✅ 聊天历史保存正常！")
    
    print("=" * 60)

if __name__ == "__main__":
    test_chat_history()
