#!/usr/bin/env python3
"""
测试 LangGraph Builder Agent

使用方法:
    python test-agent.py "我需要创建一个待办事项应用"
"""

import sys
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 添加 src 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from agents.builder_agent import run_builder_agent


def main():
    if len(sys.argv) < 2:
        print("使用方法: python test-agent.py \"你的需求描述\"")
        print("示例: python test-agent.py \"我需要创建一个简单的博客系统\"")
        return

    user_request = " ".join(sys.argv[1:])

    print(f"\n🤖 Builder Agent 正在处理你的请求...\n")
    print(f"📝 需求: {user_request}\n")
    print("-" * 60)

    try:
        result = run_builder_agent(user_request)

        print(f"\n✅ 响应:\n")
        print(result["final_message"])

        print(f"\n" + "=" * 60)
        print(f"💬 对话历史 ({len(result['all_messages'])} 条消息):")
        for i, msg in enumerate(result["all_messages"], 1):
            print(f"\n[{i}] {msg[:200]}..." if len(msg) > 200 else f"\n[{i}] {msg}")

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        print("\n请检查:")
        print("  1. .env 文件中的 API Key 是否正确")
        print("  2. 网络连接是否正常")
        print("  3. 虚拟环境是否已激活")


if __name__ == "__main__":
    main()
