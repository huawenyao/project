-- Migration: 001_create_build_sessions.sql
-- Description: 创建构建会话表（聚合根）

CREATE TABLE IF NOT EXISTS build_session (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'success', 'failed', 'partial_success')),
  agent_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP,
  storage_path VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_build_session_user_time ON build_session(user_id, start_time DESC);
CREATE INDEX idx_build_session_project ON build_session(project_id);
CREATE INDEX idx_build_session_archived ON build_session(archived, start_time DESC);
CREATE INDEX idx_build_session_status ON build_session(status);

-- 注释
COMMENT ON TABLE build_session IS '构建会话表 - 管理完整的应用构建过程生命周期';
COMMENT ON COLUMN build_session.session_id IS '会话唯一标识符';
COMMENT ON COLUMN build_session.archived IS '是否已归档到S3冷存储';
COMMENT ON COLUMN build_session.storage_path IS 'S3对象存储路径';
