"""
调试脚本：测试蒸馏功能并显示详细的调试信息
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_distill_debug():
    """测试蒸馏功能并显示详细信息"""
    print("=" * 60)
    print("蒸馏功能调试测试")
    print("=" * 60)
    
    # 测试用例：简单的想法
    text = "区块链技术通过去中心化的方式解决了数据隐私问题"
    
    print(f"\n📝 输入文本: {text}")
    print("\n🔄 发送请求到后端...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/distill", 
            json={"text": text},
            timeout=60
        )
        
        print(f"\n📊 响应状态码: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print("\n✅ 蒸馏成功！")
            print("\n📋 返回的数据结构:")
            print(f"   - one_liner: {data.get('one_liner', 'N/A')}")
            print(f"   - tags: {data.get('tags', [])}")
            print(f"   - summary 长度: {len(data.get('summary', ''))} 字符")
            print(f"   - 节点数量: {len(data.get('graph_structure', {}).get('nodes', []))}")
            print(f"   - 边数量: {len(data.get('graph_structure', {}).get('edges', []))}")
            print(f"   - 嵌入向量维度: {len(data.get('embedding_vector', []))}")
            
            # 显示节点详情
            if data.get('graph_structure', {}).get('nodes'):
                print("\n🔍 节点详情:")
                for i, node in enumerate(data['graph_structure']['nodes'][:3], 1):
                    print(f"   {i}. {node.get('name')} ({node.get('type')})")
            
            # 显示边详情
            if data.get('graph_structure', {}).get('edges'):
                print("\n🔗 关系详情:")
                for i, edge in enumerate(data['graph_structure']['edges'][:3], 1):
                    print(f"   {i}. {edge.get('source')} --[{edge.get('relation')}]--> {edge.get('target')}")
            
            return True
        else:
            print(f"\n❌ 蒸馏失败")
            print(f"错误信息: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ 请求超时（60秒）")
        print("提示：LLM 响应可能太慢，请检查 API 配置")
        return False
    except requests.exceptions.ConnectionError:
        print("\n❌ 无法连接到后端")
        print("请确保后端正在运行: python backend/app.py")
        return False
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_health():
    """测试后端健康状态"""
    print("\n🔍 检查后端状态...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.ok:
            data = response.json()
            print("✅ 后端运行正常")
            print(f"   - API 已配置: {data.get('api_configured')}")
            print(f"   - LLM 模型: {data.get('llm_model')}")
            print(f"   - 嵌入模型: {data.get('embedding_model')}")
            return True
        else:
            print("❌ 后端响应异常")
            return False
    except Exception as e:
        print(f"❌ 无法连接到后端: {e}")
        return False

def main():
    if not test_health():
        print("\n💡 提示：请先启动后端服务器")
        print("   cd backend && python app.py")
        return
    
    print("\n" + "=" * 60)
    test_distill_debug()
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
