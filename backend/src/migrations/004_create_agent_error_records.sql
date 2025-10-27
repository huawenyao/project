-- Migration: 004_create_agent_error_records.sql
-- Description: 创建 Agent 错误记录表

CREATE TABLE IF NOT EXISTS agent_error_record (
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('minor', 'critical')),
  error_category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  technical_details TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  retry_attempts SMALLINT NOT NULL DEFAULT 0,
  resolution VARCHAR(50) CHECK (resolution IN ('auto_retry_success', 'user_retry', 'user_skip', 'user_abort', 'pending')),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_error_session ON agent_error_record(session_id, timestamp DESC);
CREATE INDEX idx_error_agent ON agent_error_record(agent_id);
CREATE INDEX idx_error_type ON agent_error_record(error_type, error_category);
CREATE INDEX idx_error_unresolved ON agent_error_record(resolution) WHERE resolution = 'pending';
