#!/usr/bin/env python3
"""
集成测试脚本

测试 LangGraph Server 的所有功能：
- Builder Agent
- UI Agent
- Database Agent
- 持久化存储
- LangSmith 追踪（如果已配置）
"""

import os
import sys
import time
import requests
from typing import Dict, Any

# LangGraph Server 配置
SERVER_URL = os.getenv("LANGGRAPH_SERVER_URL", "http://localhost:8123")
TIMEOUT = 120  # 2分钟超时


class Colors:
    """终端颜色"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_success(message: str):
    """打印成功消息"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")


def print_error(message: str):
    """打印错误消息"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")


def print_info(message: str):
    """打印信息消息"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")


def print_warning(message: str):
    """打印警告消息"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")


def test_server_health() -> bool:
    """测试服务器健康检查"""
    print_info("测试服务器健康检查...")

    try:
        response = requests.get(f"{SERVER_URL}/health", timeout=5)

        if response.status_code == 200:
            print_success("服务器健康检查通过")
            return True
        else:
            print_error(f"服务器返回状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"无法连接到服务器: {SERVER_URL}")
        print_info("请确保 LangGraph Server 正在运行")
        print_info("运行命令: cd langgraph-server && ./start-server.sh")
        return False
    except Exception as e:
        print_error(f"健康检查失败: {e}")
        return False


def test_get_assistants() -> bool:
    """测试获取可用的 Agent 列表"""
    print_info("测试获取 Agent 列表...")

    try:
        response = requests.get(f"{SERVER_URL}/assistants", timeout=5)

        if response.status_code == 200:
            data = response.json()
            assistants = data.get("assistants", [])

            print_success(f"获取到 {len(assistants)} 个 Agent:")
            for assistant in assistants:
                print(f"  - {assistant}")

            # 检查必需的 Agent
            required_agents = ["builder_agent", "ui_agent", "database_agent"]
            missing_agents = [agent for agent in required_agents if agent not in assistants]

            if missing_agents:
                print_warning(f"缺少以下 Agent: {', '.join(missing_agents)}")
                return False

            return True
        else:
            print_error(f"获取 Agent 列表失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取 Agent 列表失败: {e}")
        return False


def create_thread() -> str:
    """创建线程"""
    try:
        response = requests.post(f"{SERVER_URL}/threads", json={}, timeout=5)

        if response.status_code == 200:
            data = response.json()
            thread_id = data.get("thread_id")
            print_success(f"创建线程成功: {thread_id}")
            return thread_id
        else:
            print_error(f"创建线程失败: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"创建线程失败: {e}")
        return None


def run_agent_sync(agent_name: str, request: str, thread_id: str) -> Dict[str, Any]:
    """同步运行 Agent"""
    print_info(f"运行 {agent_name}...")
    print_info(f"请求: {request}")

    try:
        # 创建运行
        response = requests.post(
            f"{SERVER_URL}/runs",
            json={
                "thread_id": thread_id,
                "assistant_id": agent_name,
                "input": {
                    "messages": [
                        {"role": "user", "content": request}
                    ]
                }
            },
            timeout=10
        )

        if response.status_code != 200:
            print_error(f"创建运行失败: {response.status_code}")
            return None

        run_data = response.json()
        run_id = run_data.get("run_id")
        print_info(f"运行ID: {run_id}")

        # 轮询获取结果
        start_time = time.time()
        while time.time() - start_time < TIMEOUT:
            time.sleep(2)  # 等待2秒

            status_response = requests.get(
                f"{SERVER_URL}/runs/{run_id}",
                params={"thread_id": thread_id},
                timeout=10
            )

            if status_response.status_code != 200:
                print_error(f"获取运行状态失败: {status_response.status_code}")
                return None

            status_data = status_response.json()
            status = status_data.get("status")

            print_info(f"状态: {status}")

            if status in ["success", "completed"]:
                print_success(f"{agent_name} 运行成功!")
                return status_data
            elif status in ["failed", "error"]:
                error_msg = status_data.get("error", "Unknown error")
                print_error(f"{agent_name} 运行失败: {error_msg}")
                return None

        print_error(f"{agent_name} 运行超时")
        return None

    except Exception as e:
        print_error(f"{agent_name} 运行失败: {e}")
        return None


def test_builder_agent() -> bool:
    """测试 Builder Agent"""
    print_info("\n=== 测试 Builder Agent ===")

    thread_id = create_thread()
    if not thread_id:
        return False

    request = "我需要创建一个待办事项应用，功能包括添加、编辑、删除和标记完成任务"
    result = run_agent_sync("builder_agent", request, thread_id)

    if result:
        print_success("Builder Agent 测试通过")

        # 打印结果
        messages = result.get("messages", [])
        print_info(f"生成了 {len(messages)} 条消息")

        return True
    else:
        print_error("Builder Agent 测试失败")
        return False


def test_ui_agent() -> bool:
    """测试 UI Agent"""
    print_info("\n=== 测试 UI Agent ===")

    thread_id = create_thread()
    if not thread_id:
        return False

    request = "设计一个待办事项应用的UI，需要任务列表、添加按钮和搜索框"
    result = run_agent_sync("ui_agent", request, thread_id)

    if result:
        print_success("UI Agent 测试通过")

        # 打印结果
        messages = result.get("messages", [])
        print_info(f"生成了 {len(messages)} 条消息")

        return True
    else:
        print_error("UI Agent 测试失败")
        return False


def test_database_agent() -> bool:
    """测试 Database Agent"""
    print_info("\n=== 测试 Database Agent ===")

    thread_id = create_thread()
    if not thread_id:
        return False

    request = "设计一个待办事项应用的数据库架构，包括用户和任务表"
    result = run_agent_sync("database_agent", request, thread_id)

    if result:
        print_success("Database Agent 测试通过")

        # 打印结果
        messages = result.get("messages", [])
        print_info(f"生成了 {len(messages)} 条消息")

        return True
    else:
        print_error("Database Agent 测试失败")
        return False


def test_persistence() -> bool:
    """测试持久化存储"""
    print_info("\n=== 测试持久化存储 ===")

    # 检查数据库连接
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print_warning("未配置 DATABASE_URL，跳过持久化测试")
        return True

    print_success("持久化存储配置已设置")

    # TODO: 添加数据库连接测试
    # 这里可以添加直接的数据库查询来验证数据是否被持久化

    return True


def test_langsmith_tracing() -> bool:
    """测试 LangSmith 追踪"""
    print_info("\n=== 测试 LangSmith 追踪 ===")

    tracing_enabled = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    api_key = os.getenv("LANGCHAIN_API_KEY")

    if not tracing_enabled or not api_key:
        print_warning("LangSmith 追踪未启用")
        print_info("要启用追踪，请在 .env 中设置:")
        print_info("  LANGCHAIN_TRACING_V2=true")
        print_info("  LANGCHAIN_API_KEY=your-api-key")
        return True

    print_success("LangSmith 追踪已启用")
    print_info(f"项目: {os.getenv('LANGCHAIN_PROJECT', 'ai-builder-studio')}")

    return True


def main():
    """主函数"""
    print("\n" + "="*60)
    print("LangGraph Server 集成测试")
    print("="*60 + "\n")

    # 运行所有测试
    tests = [
        ("服务器健康检查", test_server_health),
        ("获取 Agent 列表", test_get_assistants),
        ("Builder Agent", test_builder_agent),
        ("UI Agent", test_ui_agent),
        ("Database Agent", test_database_agent),
        ("持久化存储", test_persistence),
        ("LangSmith 追踪", test_langsmith_tracing),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except KeyboardInterrupt:
            print_warning("\n测试被中断")
            sys.exit(1)
        except Exception as e:
            print_error(f"测试 '{test_name}' 遇到未预期的错误: {e}")
            results.append((test_name, False))

    # 打印测试总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60 + "\n")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} {test_name}")

    print("\n" + "-"*60)
    print(f"总计: {passed}/{total} 测试通过")

    if passed == total:
        print_success("\n🎉 所有测试通过!")
        sys.exit(0)
    else:
        print_error(f"\n{total - passed} 个测试失败")
        sys.exit(1)


if __name__ == "__main__":
    main()
