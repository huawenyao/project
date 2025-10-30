"""
会话存储管理器

负责：
- Agent 会话的持久化
- 消息历史存储
- 生成的 artifacts 存储
- 会话查询和检索
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import uuid
from .database import get_db_manager


class SessionStore:
    """会话存储管理器"""

    def __init__(self):
        self.db = get_db_manager()

    def create_session(
        self,
        agent_type: str,
        user_id: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        创建新会话

        Args:
            agent_type: Agent 类型
            user_id: 用户 ID
            input_data: 输入数据
            metadata: 元数据

        Returns:
            会话 ID
        """
        session_id = str(uuid.uuid4())

        query = """
        INSERT INTO agent_sessions
            (session_id, user_id, agent_type, status, input_data, metadata)
        VALUES
            (%s, %s, %s, %s, %s, %s)
        RETURNING session_id
        """

        params = (
            session_id,
            user_id,
            agent_type,
            'active',
            json.dumps(input_data) if input_data else None,
            json.dumps(metadata) if metadata else None
        )

        try:
            result = self.db.execute_query(query, params)
            return result[0]['session_id'] if result else session_id
        except Exception as e:
            print(f"创建会话失败: {e}")
            return session_id

    def update_session(
        self,
        session_id: str,
        status: Optional[str] = None,
        output_data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        更新会话

        Args:
            session_id: 会话 ID
            status: 会话状态
            output_data: 输出数据
            metadata: 元数据
        """
        updates = []
        params = []

        if status:
            updates.append("status = %s")
            params.append(status)

        if output_data:
            updates.append("output_data = %s")
            params.append(json.dumps(output_data))

        if metadata:
            updates.append("metadata = %s")
            params.append(json.dumps(metadata))

        updates.append("updated_at = NOW()")
        params.append(session_id)

        query = f"""
        UPDATE agent_sessions
        SET {', '.join(updates)}
        WHERE session_id = %s
        """

        try:
            self.db.execute_query(query, tuple(params), fetch=False)
        except Exception as e:
            print(f"更新会话失败: {e}")

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        tool_calls: Optional[List[Dict]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        添加消息到会话

        Args:
            session_id: 会话 ID
            role: 消息角色 (user, assistant, system)
            content: 消息内容
            tool_calls: 工具调用
            metadata: 元数据

        Returns:
            消息 ID
        """
        message_id = str(uuid.uuid4())

        query = """
        INSERT INTO agent_messages
            (message_id, session_id, role, content, tool_calls, metadata)
        VALUES
            (%s, %s, %s, %s, %s, %s)
        RETURNING message_id
        """

        params = (
            message_id,
            session_id,
            role,
            content,
            json.dumps(tool_calls) if tool_calls else None,
            json.dumps(metadata) if metadata else None
        )

        try:
            result = self.db.execute_query(query, params)
            return result[0]['message_id'] if result else message_id
        except Exception as e:
            print(f"添加消息失败: {e}")
            return message_id

    def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """
        获取会话的所有消息

        Args:
            session_id: 会话 ID

        Returns:
            消息列表
        """
        query = """
        SELECT
            message_id, role, content, tool_calls, metadata, created_at
        FROM agent_messages
        WHERE session_id = %s
        ORDER BY created_at ASC
        """

        try:
            return self.db.execute_query(query, (session_id,)) or []
        except Exception as e:
            print(f"获取消息失败: {e}")
            return []

    def save_artifact(
        self,
        session_id: str,
        artifact_type: str,
        artifact_name: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        保存生成的 artifact

        Args:
            session_id: 会话 ID
            artifact_type: artifact 类型 (code, design, schema, etc.)
            artifact_name: artifact 名称
            content: 内容
            metadata: 元数据

        Returns:
            artifact ID
        """
        artifact_id = str(uuid.uuid4())

        query = """
        INSERT INTO agent_artifacts
            (artifact_id, session_id, artifact_type, artifact_name, content, metadata)
        VALUES
            (%s, %s, %s, %s, %s, %s)
        RETURNING artifact_id
        """

        params = (
            artifact_id,
            session_id,
            artifact_type,
            artifact_name,
            content,
            json.dumps(metadata) if metadata else None
        )

        try:
            result = self.db.execute_query(query, params)
            return result[0]['artifact_id'] if result else artifact_id
        except Exception as e:
            print(f"保存 artifact 失败: {e}")
            return artifact_id

    def get_session_artifacts(self, session_id: str) -> List[Dict[str, Any]]:
        """
        获取会话的所有 artifacts

        Args:
            session_id: 会话 ID

        Returns:
            artifacts 列表
        """
        query = """
        SELECT
            artifact_id, artifact_type, artifact_name,
            content, metadata, created_at
        FROM agent_artifacts
        WHERE session_id = %s
        ORDER BY created_at DESC
        """

        try:
            return self.db.execute_query(query, (session_id,)) or []
        except Exception as e:
            print(f"获取 artifacts 失败: {e}")
            return []

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        获取会话信息

        Args:
            session_id: 会话 ID

        Returns:
            会话信息
        """
        query = """
        SELECT
            session_id, user_id, agent_type, status,
            input_data, output_data, metadata,
            created_at, updated_at
        FROM agent_sessions
        WHERE session_id = %s
        """

        try:
            result = self.db.execute_query(query, (session_id,))
            return result[0] if result else None
        except Exception as e:
            print(f"获取会话失败: {e}")
            return None

    def list_sessions(
        self,
        user_id: Optional[str] = None,
        agent_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        列出会话

        Args:
            user_id: 用户 ID 过滤
            agent_type: Agent 类型过滤
            status: 状态过滤
            limit: 返回数量限制

        Returns:
            会话列表
        """
        conditions = []
        params = []

        if user_id:
            conditions.append("user_id = %s")
            params.append(user_id)

        if agent_type:
            conditions.append("agent_type = %s")
            params.append(agent_type)

        if status:
            conditions.append("status = %s")
            params.append(status)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)

        query = f"""
        SELECT
            session_id, user_id, agent_type, status,
            created_at, updated_at
        FROM agent_sessions
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s
        """

        try:
            return self.db.execute_query(query, tuple(params)) or []
        except Exception as e:
            print(f"列出会话失败: {e}")
            return []


# 全局会话存储实例
_session_store: Optional[SessionStore] = None


def get_session_store() -> SessionStore:
    """获取全局会话存储实例"""
    global _session_store
    if _session_store is None:
        _session_store = SessionStore()
    return _session_store


if __name__ == "__main__":
    # 测试代码
    store = SessionStore()

    # 创建会话
    session_id = store.create_session(
        agent_type="builder_agent",
        user_id="test_user",
        input_data={"request": "创建一个待办事项应用"}
    )
    print(f"创建会话: {session_id}")

    # 添加消息
    store.add_message(
        session_id=session_id,
        role="user",
        content="我需要创建一个待办事项应用"
    )

    store.add_message(
        session_id=session_id,
        role="assistant",
        content="好的，我来帮你设计这个应用..."
    )

    # 保存 artifact
    artifact_id = store.save_artifact(
        session_id=session_id,
        artifact_type="code",
        artifact_name="TodoList.tsx",
        content="import React from 'react';\n\nexport const TodoList = () => { ... };"
    )
    print(f"保存 artifact: {artifact_id}")

    # 获取会话消息
    messages = store.get_session_messages(session_id)
    print(f"\n会话消息 ({len(messages)} 条):")
    for msg in messages:
        print(f"  [{msg['role']}] {msg['content'][:50]}...")

    # 获取 artifacts
    artifacts = store.get_session_artifacts(session_id)
    print(f"\n会话 Artifacts ({len(artifacts)} 个):")
    for art in artifacts:
        print(f"  - {art['artifact_type']}: {art['artifact_name']}")
