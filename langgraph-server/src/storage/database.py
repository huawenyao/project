"""
数据库管理器

负责：
- 数据库连接管理
- 连接池配置
- 基础 CRUD 操作
"""

import psycopg2
from psycopg2 import pool
from typing import Optional, List, Dict, Any
import os
from contextlib import contextmanager


class DatabaseManager:
    """数据库管理器"""

    def __init__(self, connection_string: Optional[str] = None):
        """
        初始化数据库管理器

        Args:
            connection_string: 数据库连接字符串
        """
        self.connection_string = connection_string or os.getenv(
            "DATABASE_URL",
            "postgresql://localhost:5432/ai_builder_studio"
        )

        # 创建连接池
        try:
            self.pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dsn=self.connection_string
            )
            print(f"✅ 数据库连接池创建成功")
        except Exception as e:
            print(f"⚠️  数据库连接失败: {e}")
            print(f"   提示: 请确保 PostgreSQL 正在运行并且连接字符串正确")
            self.pool = None

    @contextmanager
    def get_connection(self):
        """
        获取数据库连接（上下文管理器）

        Yields:
            数据库连接
        """
        if not self.pool:
            raise Exception("数据库连接池未初始化")

        conn = self.pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            self.pool.putconn(conn)

    def execute_query(
        self,
        query: str,
        params: Optional[tuple] = None,
        fetch: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """
        执行 SQL 查询

        Args:
            query: SQL 查询语句
            params: 查询参数
            fetch: 是否获取结果

        Returns:
            查询结果列表
        """
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)

                if fetch and cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    rows = cursor.fetchall()
                    return [dict(zip(columns, row)) for row in rows]

                return None

    def initialize_schema(self):
        """初始化数据库架构"""
        schema_sql = """
        -- 创建 agent_sessions 表
        CREATE TABLE IF NOT EXISTS agent_sessions (
            session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255),
            agent_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            input_data JSONB,
            output_data JSONB,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id
            ON agent_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_type
            ON agent_sessions(agent_type);
        CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at
            ON agent_sessions(created_at);

        -- 创建 agent_messages 表
        CREATE TABLE IF NOT EXISTS agent_messages (
            message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            tool_calls JSONB,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id
            ON agent_messages(session_id);

        -- 创建 agent_artifacts 表（存储生成的代码、设计等）
        CREATE TABLE IF NOT EXISTS agent_artifacts (
            artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES agent_sessions(session_id) ON DELETE CASCADE,
            artifact_type VARCHAR(50) NOT NULL,
            artifact_name VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_agent_artifacts_session_id
            ON agent_artifacts(session_id);
        CREATE INDEX IF NOT EXISTS idx_agent_artifacts_artifact_type
            ON agent_artifacts(artifact_type);
        """

        try:
            self.execute_query(schema_sql, fetch=False)
            print("✅ 数据库架构初始化成功")
        except Exception as e:
            print(f"❌ 数据库架构初始化失败: {e}")
            raise

    def close(self):
        """关闭连接池"""
        if self.pool:
            self.pool.closeall()
            print("数据库连接池已关闭")


# 全局数据库管理器实例
_db_manager: Optional[DatabaseManager] = None


def get_db_manager() -> DatabaseManager:
    """获取全局数据库管理器实例"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager


if __name__ == "__main__":
    # 测试代码
    db = DatabaseManager()

    try:
        # 初始化架构
        db.initialize_schema()

        # 测试查询
        result = db.execute_query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )
        print("\n数据库表列表:")
        for row in result:
            print(f"  - {row['table_name']}")

    except Exception as e:
        print(f"错误: {e}")
    finally:
        db.close()
