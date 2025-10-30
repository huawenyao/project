"""
LangSmith 追踪配置

负责：
- LangSmith 追踪初始化
- 自定义追踪标签
- 性能监控
"""

import os
from typing import Optional, Dict, Any
from functools import wraps
import time


class TracingConfig:
    """追踪配置管理器"""

    def __init__(self):
        self.enabled = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
        self.api_key = os.getenv("LANGCHAIN_API_KEY")
        self.project = os.getenv("LANGCHAIN_PROJECT", "ai-builder-studio")
        self.endpoint = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")

    def is_enabled(self) -> bool:
        """检查追踪是否启用"""
        return self.enabled and bool(self.api_key)

    def get_config(self) -> Dict[str, Any]:
        """获取追踪配置"""
        return {
            "enabled": self.enabled,
            "project": self.project,
            "endpoint": self.endpoint
        }

    def initialize(self):
        """初始化 LangSmith 追踪"""
        if self.is_enabled():
            print(f"✅ LangSmith 追踪已启用")
            print(f"   项目: {self.project}")
            print(f"   端点: {self.endpoint}")
        else:
            print("⚠️  LangSmith 追踪未启用")
            if not self.api_key:
                print("   提示: 设置 LANGCHAIN_API_KEY 环境变量以启用追踪")


# 全局追踪配置
tracing_config = TracingConfig()


def trace_agent_execution(agent_name: str):
    """
    装饰器：追踪 Agent 执行

    Args:
        agent_name: Agent 名称
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                if tracing_config.is_enabled():
                    print(f"🔍 [{agent_name}] 执行完成 - 耗时: {duration:.2f}s")

                return result

            except Exception as e:
                duration = time.time() - start_time
                if tracing_config.is_enabled():
                    print(f"❌ [{agent_name}] 执行失败 - 耗时: {duration:.2f}s")
                    print(f"   错误: {e}")
                raise

        return wrapper
    return decorator


def get_run_metadata(
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    **extra
) -> Dict[str, Any]:
    """
    获取运行元数据（用于 LangSmith）

    Args:
        user_id: 用户 ID
        session_id: 会话 ID
        **extra: 其他元数据

    Returns:
        元数据字典
    """
    metadata = {
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "0.1.0"
    }

    if user_id:
        metadata["user_id"] = user_id

    if session_id:
        metadata["session_id"] = session_id

    metadata.update(extra)

    return metadata


if __name__ == "__main__":
    # 测试追踪配置
    tracing_config.initialize()

    print("\n配置详情:")
    for key, value in tracing_config.get_config().items():
        print(f"  {key}: {value}")

    # 测试装饰器
    @trace_agent_execution("test_agent")
    def test_function():
        import time
        time.sleep(0.5)
        return "完成"

    result = test_function()
    print(f"\n测试结果: {result}")
