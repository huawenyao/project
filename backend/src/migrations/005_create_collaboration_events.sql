-- Migration: 005_create_collaboration_events.sql
-- Description: 创建协作事件表

CREATE TABLE IF NOT EXISTS collaboration_event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  source_agent_id VARCHAR(100) NOT NULL,
  source_agent_type VARCHAR(50) NOT NULL,
  target_agent_id VARCHAR(100) NOT NULL,
  target_agent_type VARCHAR(50) NOT NULL,
  data_summary TEXT NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_collab_session ON collaboration_event(session_id, timestamp);
CREATE INDEX idx_collab_source ON collaboration_event(source_agent_id);
CREATE INDEX idx_collab_target ON collaboration_event(target_agent_id);
CREATE INDEX idx_collab_flow ON collaboration_event(source_agent_type, target_agent_type);
