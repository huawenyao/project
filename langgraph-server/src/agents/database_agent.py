"""
Database Agent - 数据库设计和管理代理

负责：
- 数据库架构设计
- 表结构设计
- 索引优化建议
- 数据迁移脚本生成
- 查询优化
"""

from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
import operator
import json


class DatabaseAgentState(TypedDict):
    """Database Agent 状态定义"""
    messages: Annotated[list[BaseMessage], operator.add]
    data_requirements: dict
    database_type: str
    schema_design: dict
    migrations: list[str]
    indexes: list[dict]


@tool
def analyze_data_requirements(description: str) -> dict:
    """
    分析数据需求

    Args:
        description: 数据需求描述

    Returns:
        数据需求分析结果
    """
    return {
        "entities": [
            {
                "name": "User",
                "attributes": ["id", "email", "password", "name", "created_at"],
                "relationships": ["has_many: posts", "has_many: comments"]
            },
            {
                "name": "Post",
                "attributes": ["id", "title", "content", "author_id", "created_at"],
                "relationships": ["belongs_to: user", "has_many: comments"]
            },
            {
                "name": "Comment",
                "attributes": ["id", "content", "user_id", "post_id", "created_at"],
                "relationships": ["belongs_to: user", "belongs_to: post"]
            }
        ],
        "expected_scale": "medium",  # small, medium, large
        "read_write_ratio": "80:20",  # 读写比例
        "concurrent_users": 1000
    }


@tool
def select_database_type(requirements: dict) -> dict:
    """
    选择合适的数据库类型

    Args:
        requirements: 数据需求

    Returns:
        推荐的数据库类型和原因
    """
    return {
        "recommended": "PostgreSQL",
        "alternatives": [
            {"name": "MySQL", "use_case": "简单的关系型数据"},
            {"name": "MongoDB", "use_case": "文档型数据"},
            {"name": "Redis", "use_case": "缓存和会话存储"}
        ],
        "reasons": [
            "强大的 ACID 支持",
            "优秀的 JSON 支持",
            "丰富的索引类型",
            "活跃的社区",
            "适合中大型应用"
        ],
        "recommended_version": "16.x"
    }


@tool
def design_database_schema(entities: list[dict], db_type: str) -> dict:
    """
    设计数据库架构

    Args:
        entities: 实体列表
        db_type: 数据库类型

    Returns:
        完整的数据库架构设计
    """
    return {
        "database": "ai_builder_app",
        "tables": [
            {
                "name": "users",
                "columns": [
                    {"name": "id", "type": "UUID", "constraints": ["PRIMARY KEY", "DEFAULT gen_random_uuid()"]},
                    {"name": "email", "type": "VARCHAR(255)", "constraints": ["NOT NULL", "UNIQUE"]},
                    {"name": "password_hash", "type": "VARCHAR(255)", "constraints": ["NOT NULL"]},
                    {"name": "name", "type": "VARCHAR(100)", "constraints": ["NOT NULL"]},
                    {"name": "created_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]},
                    {"name": "updated_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]}
                ],
                "indexes": [
                    {"name": "idx_users_email", "columns": ["email"], "type": "BTREE"},
                    {"name": "idx_users_created_at", "columns": ["created_at"], "type": "BTREE"}
                ]
            },
            {
                "name": "posts",
                "columns": [
                    {"name": "id", "type": "UUID", "constraints": ["PRIMARY KEY", "DEFAULT gen_random_uuid()"]},
                    {"name": "title", "type": "VARCHAR(200)", "constraints": ["NOT NULL"]},
                    {"name": "content", "type": "TEXT", "constraints": ["NOT NULL"]},
                    {"name": "author_id", "type": "UUID", "constraints": ["NOT NULL"]},
                    {"name": "status", "type": "VARCHAR(20)", "constraints": ["DEFAULT 'draft'"]},
                    {"name": "created_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]},
                    {"name": "updated_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]}
                ],
                "foreign_keys": [
                    {"column": "author_id", "references": "users(id)", "on_delete": "CASCADE"}
                ],
                "indexes": [
                    {"name": "idx_posts_author_id", "columns": ["author_id"], "type": "BTREE"},
                    {"name": "idx_posts_status", "columns": ["status"], "type": "BTREE"},
                    {"name": "idx_posts_created_at", "columns": ["created_at"], "type": "BTREE"}
                ]
            },
            {
                "name": "comments",
                "columns": [
                    {"name": "id", "type": "UUID", "constraints": ["PRIMARY KEY", "DEFAULT gen_random_uuid()"]},
                    {"name": "content", "type": "TEXT", "constraints": ["NOT NULL"]},
                    {"name": "user_id", "type": "UUID", "constraints": ["NOT NULL"]},
                    {"name": "post_id", "type": "UUID", "constraints": ["NOT NULL"]},
                    {"name": "created_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]},
                    {"name": "updated_at", "type": "TIMESTAMP", "constraints": ["DEFAULT NOW()"]}
                ],
                "foreign_keys": [
                    {"column": "user_id", "references": "users(id)", "on_delete": "CASCADE"},
                    {"column": "post_id", "references": "posts(id)", "on_delete": "CASCADE"}
                ],
                "indexes": [
                    {"name": "idx_comments_post_id", "columns": ["post_id"], "type": "BTREE"},
                    {"name": "idx_comments_user_id", "columns": ["user_id"], "type": "BTREE"}
                ]
            }
        ],
        "views": [],
        "stored_procedures": []
    }


@tool
def generate_migration_sql(schema: dict) -> str:
    """
    生成数据库迁移 SQL

    Args:
        schema: 数据库架构

    Returns:
        SQL 迁移脚本
    """
    sql = f"""-- Database Migration Script
-- Generated by Database Agent
-- Database: {schema.get('database', 'app_db')}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

"""

    # 生成创建表的 SQL
    for table in schema.get("tables", []):
        sql += f"\n-- Table: {table['name']}\n"
        sql += f"CREATE TABLE IF NOT EXISTS {table['name']} (\n"

        columns = []
        for col in table['columns']:
            col_def = f"  {col['name']} {col['type']}"
            if 'constraints' in col:
                col_def += " " + " ".join(col['constraints'])
            columns.append(col_def)

        sql += ",\n".join(columns)
        sql += "\n);\n"

        # 添加外键
        if 'foreign_keys' in table:
            for fk in table['foreign_keys']:
                sql += f"\nALTER TABLE {table['name']}\n"
                sql += f"  ADD CONSTRAINT fk_{table['name']}_{fk['column']}\n"
                sql += f"  FOREIGN KEY ({fk['column']})\n"
                sql += f"  REFERENCES {fk['references']}\n"
                sql += f"  ON DELETE {fk.get('on_delete', 'CASCADE')};\n"

        # 添加索引
        if 'indexes' in table:
            for idx in table['indexes']:
                cols = ", ".join(idx['columns'])
                sql += f"\nCREATE INDEX IF NOT EXISTS {idx['name']}\n"
                sql += f"  ON {table['name']} ({cols});\n"

    sql += "\n-- Migration completed\n"
    return sql


@tool
def suggest_indexes(table_name: str, query_patterns: list[str]) -> list[dict]:
    """
    基于查询模式建议索引

    Args:
        table_name: 表名
        query_patterns: 查询模式列表

    Returns:
        索引建议
    """
    return [
        {
            "index_name": f"idx_{table_name}_composite",
            "columns": ["status", "created_at"],
            "type": "BTREE",
            "reason": "优化状态和时间范围查询",
            "estimated_improvement": "3-5x faster"
        },
        {
            "index_name": f"idx_{table_name}_fulltext",
            "columns": ["title", "content"],
            "type": "GIN",
            "reason": "支持全文搜索",
            "estimated_improvement": "10x faster for text search"
        }
    ]


@tool
def generate_orm_models(schema: dict, orm_type: str = "prisma") -> str:
    """
    生成 ORM 模型定义

    Args:
        schema: 数据库架构
        orm_type: ORM 类型 (prisma, sequelize, typeorm)

    Returns:
        ORM 模型代码
    """
    if orm_type == "prisma":
        code = """// Prisma Schema
// Generated by Database Agent

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid()) @db.Uuid
  email       String   @unique @db.VarChar(255)
  passwordHash String  @map("password_hash") @db.VarChar(255)
  name        String   @db.VarChar(100)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")

  posts       Post[]
  comments    Comment[]

  @@index([email])
  @@index([createdAt])
  @@map("users")
}

model Post {
  id        String   @id @default(uuid()) @db.Uuid
  title     String   @db.VarChar(200)
  content   String   @db.Text
  authorId  String   @map("author_id") @db.Uuid
  status    String   @default("draft") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]

  @@index([authorId])
  @@index([status])
  @@index([createdAt])
  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  content   String   @db.Text
  userId    String   @map("user_id") @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([userId])
  @@map("comments")
}
"""
        return code.strip()

    return "// ORM model generation for other types not yet implemented"


# 定义可用工具
tools = [
    analyze_data_requirements,
    select_database_type,
    design_database_schema,
    generate_migration_sql,
    suggest_indexes,
    generate_orm_models
]


def should_continue(state: DatabaseAgentState) -> Literal["tools", "__end__"]:
    """决定是否继续执行"""
    messages = state["messages"]
    last_message = messages[-1]

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    return END


def call_model(state: DatabaseAgentState):
    """调用 LLM 模型"""
    messages = state["messages"]

    # 系统提示词
    system_prompt = """你是一个专业的数据库架构师和 DBA。

你的职责：
1. 分析数据需求
2. 设计高效的数据库架构
3. 生成迁移脚本
4. 提供索引优化建议
5. 生成 ORM 模型代码

你应该：
- 遵循数据库设计最佳实践
- 考虑性能、可扩展性和数据完整性
- 提供清晰的 SQL 脚本和注释
- 给出具体的优化建议

设计原则：
- 使用 UUID 作为主键
- 添加 created_at 和 updated_at 时间戳
- 合理使用索引（不要过度索引）
- 设置适当的外键约束和级联删除
- 考虑查询性能

在回答时，请调用相关工具来完成任务。"""

    messages_with_system = [
        HumanMessage(content=system_prompt)
    ] + messages

    model = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7
    )

    model_with_tools = model.bind_tools(tools)
    response = model_with_tools.invoke(messages_with_system)

    return {"messages": [response]}


def create_database_agent_graph():
    """创建 Database Agent 图"""
    workflow = StateGraph(DatabaseAgentState)

    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))

    workflow.set_entry_point("agent")

    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END
        }
    )

    workflow.add_edge("tools", "agent")

    return workflow.compile()


def run_database_agent(user_request: str) -> dict:
    """
    运行 Database Agent

    Args:
        user_request: 用户请求

    Returns:
        Agent 响应
    """
    graph = create_database_agent_graph()

    initial_state = {
        "messages": [HumanMessage(content=user_request)],
        "data_requirements": {},
        "database_type": "",
        "schema_design": {},
        "migrations": [],
        "indexes": []
    }

    result = graph.invoke(initial_state)

    return {
        "final_message": result["messages"][-1].content,
        "all_messages": [msg.content for msg in result["messages"]],
        "state": result
    }


if __name__ == "__main__":
    # 测试代码
    result = run_database_agent("我需要为一个博客系统设计数据库，包括用户、文章和评论")
    print("Database Agent Response:", result["final_message"])
