-- Migration: 002_create_agent_work_status.sql
-- Description: 创建Agent工作状态表

CREATE TABLE IF NOT EXISTS agent_work_status (
  status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'retrying', 'skipped')),
  task_description VARCHAR(500),
  progress_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  retry_count SMALLINT NOT NULL DEFAULT 0,
  max_retry SMALLINT NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_agent_status_session ON agent_work_status(session_id, agent_type);
CREATE INDEX idx_agent_status_agent_id ON agent_work_status(agent_id);
CREATE INDEX idx_agent_status_status ON agent_work_status(status);
CREATE INDEX idx_agent_status_updated ON agent_work_status(updated_at DESC);

-- 注释
COMMENT ON TABLE agent_work_status IS 'Agent工作状态表 - 实时跟踪Agent执行状态和进度';
COMMENT ON COLUMN agent_work_status.progress_percentage IS '进度百分比 (0-100)';
COMMENT ON COLUMN agent_work_status.retry_count IS '当前重试次数';
