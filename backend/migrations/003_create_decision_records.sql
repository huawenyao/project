-- Migration: 003_create_decision_records.sql
-- Description: 创建AI决策记录表

CREATE TABLE IF NOT EXISTS decision_record (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  reasoning JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternatives JSONB,
  tradeoffs TEXT,
  importance VARCHAR(10) NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_decision_session ON decision_record(session_id, timestamp DESC);
CREATE INDEX idx_decision_agent ON decision_record(agent_id);
CREATE INDEX idx_decision_importance ON decision_record(importance, is_read);
CREATE INDEX idx_decision_unread ON decision_record(session_id, is_read) WHERE is_read = FALSE;

-- 注释
COMMENT ON TABLE decision_record IS 'AI决策记录表 - 透明化Agent决策推理过程';
COMMENT ON COLUMN decision_record.importance IS '决策重要性: high(toast通知), medium/low(仅侧边栏)';
COMMENT ON COLUMN decision_record.is_read IS '用户是否已读';
