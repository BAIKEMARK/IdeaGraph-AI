# 魔搭社区创空间入口文件
# 这个文件是为了兼容魔搭社区的部署要求

import os
import sys

# 添加 backend 目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# 导入并启动应用
from app import app

if __name__ == "__main__":
    # 魔搭社区创空间需要监听 7860 端口
    port = int(os.getenv("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False)