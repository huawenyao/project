-- Migration: 009_create_indexes.sql
-- Description: 创建额外的性能优化索引

-- 复合索引：会话+Agent类型组合查询
CREATE INDEX IF NOT EXISTS idx_agent_session_type_status
ON agent_work_status(session_id, agent_type, status);

-- 复合索引：会话+决策重要性查询
CREATE INDEX IF NOT EXISTS idx_decision_session_importance
ON decision_record(session_id, importance, timestamp DESC);

-- 复合索引：会话+错误类型查询
CREATE INDEX IF NOT EXISTS idx_error_session_type
ON agent_error_record(session_id, error_type, timestamp DESC);

-- GIN索引：JSONB字段全文检索
CREATE INDEX IF NOT EXISTS idx_decision_reasoning_gin
ON decision_record USING GIN (reasoning);

CREATE INDEX IF NOT EXISTS idx_metric_context_gin
ON user_interaction_metric_event USING GIN (context);

-- 部分索引：仅索引活跃会话
CREATE INDEX IF NOT EXISTS idx_build_session_active
ON build_session(session_id, status, updated_at DESC)
WHERE status IN ('in_progress', 'pending');

-- 部分索引：仅索引未归档的会话
CREATE INDEX IF NOT EXISTS idx_build_session_hot
ON build_session(start_time DESC)
WHERE archived = FALSE;

-- 注释
COMMENT ON INDEX idx_agent_session_type_status IS '优化：按会话+Agent类型+状态组合查询';
COMMENT ON INDEX idx_decision_reasoning_gin IS '优化：决策理由全文检索';
COMMENT ON INDEX idx_build_session_active IS '优化：仅索引活跃会话，减少索引大小';
