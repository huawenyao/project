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

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_build_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_build_session_updated
BEFORE UPDATE ON build_session
FOR EACH ROW
EXECUTE FUNCTION update_build_session_timestamp();
