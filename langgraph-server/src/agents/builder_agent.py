"""
AI Builder Agent - 应用构建代理

这个 Agent 可以帮助用户构建应用，包括：
- 分析用户需求
- 生成应用架构
- 创建组件代码
- 提供部署建议
"""

from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
import operator


class AgentState(TypedDict):
    """Agent 状态定义"""
    messages: Annotated[list[BaseMessage], operator.add]
    user_request: str
    app_architecture: dict
    next_step: str


@tool
def analyze_requirements(user_input: str) -> dict:
    """
    分析用户需求并提取关键信息

    Args:
        user_input: 用户的应用需求描述

    Returns:
        分析结果，包含应用类型、核心功能等
    """
    # 这是一个简化的示例，实际应该使用更复杂的分析逻辑
    return {
        "app_type": "web_application",
        "features": ["user_authentication", "data_management", "api_integration"],
        "tech_stack": "auto",
        "complexity": "medium"
    }


@tool
def generate_architecture(requirements: dict) -> dict:
    """
    根据需求生成应用架构

    Args:
        requirements: 需求分析结果

    Returns:
        应用架构设计
    """
    return {
        "frontend": "React + TypeScript",
        "backend": "Node.js + Express",
        "database": "PostgreSQL",
        "deployment": "Docker",
        "estimated_time": "2-3 weeks"
    }


@tool
def generate_component_code(component_spec: dict) -> str:
    """
    生成组件代码

    Args:
        component_spec: 组件规格说明

    Returns:
        生成的代码
    """
    return """
    // Generated Component Code
    import React from 'react';

    export const MyComponent: React.FC = () => {
        return <div>Hello from Generated Component</div>;
    };
    """


# 定义可用的工具
tools = [analyze_requirements, generate_architecture, generate_component_code]


def should_continue(state: AgentState) -> str:
    """决定是否继续执行或结束"""
    messages = state["messages"]
    last_message = messages[-1]

    # 如果最后一条消息包含工具调用，继续执行工具
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # 否则结束
    return END


def call_model(state: AgentState):
    """调用 LLM 模型"""
    messages = state["messages"]

    # 创建 LLM 实例（可以配置使用 OpenAI 或 Anthropic）
    model = ChatOpenAI(
        model="gpt-4o-mini",  # 使用更经济的模型进行测试
        temperature=0.7
    )

    # 绑定工具
    model_with_tools = model.bind_tools(tools)

    # 调用模型
    response = model_with_tools.invoke(messages)

    # 返回更新后的状态
    return {"messages": [response]}


def create_builder_graph():
    """创建 Builder Agent 图"""

    # 创建状态图
    workflow = StateGraph(AgentState)

    # 添加节点
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))

    # 设置入口点
    workflow.set_entry_point("agent")

    # 添加条件边
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )

    # 工具执行后返回 agent
    workflow.add_edge("tools", "agent")

    # 编译图
    return workflow.compile()


# 便捷函数：运行 agent
def run_builder_agent(user_request: str) -> dict:
    """
    运行 Builder Agent

    Args:
        user_request: 用户请求

    Returns:
        Agent 响应
    """
    graph = create_builder_graph()

    initial_state = {
        "messages": [HumanMessage(content=user_request)],
        "user_request": user_request,
        "app_architecture": {},
        "next_step": ""
    }

    result = graph.invoke(initial_state)

    return {
        "final_message": result["messages"][-1].content,
        "all_messages": [msg.content for msg in result["messages"]],
        "state": result
    }


if __name__ == "__main__":
    # 测试代码
    result = run_builder_agent("我需要创建一个简单的待办事项应用")
    print("Agent Response:", result["final_message"])
