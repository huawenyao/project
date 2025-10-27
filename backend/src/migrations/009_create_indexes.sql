-- Migration: 009_create_indexes.sql
-- Description: 创建额外的复合索引和性能优化索引

-- BuildSession 性能优化索引
CREATE INDEX IF NOT EXISTS idx_build_session_composite
ON build_session(user_id, status, start_time DESC)
WHERE archived = FALSE;

-- AgentWorkStatus 实时查询优化
CREATE INDEX IF NOT EXISTS idx_agent_status_realtime
ON agent_work_status(session_id, status, updated_at DESC)
WHERE status IN ('pending', 'in_progress', 'retrying');

-- DecisionRecord 未读决策快速查询
CREATE INDEX IF NOT EXISTS idx_decision_unread_important
ON decision_record(session_id, importance, timestamp DESC)
WHERE is_read = FALSE;

-- AgentErrorRecord 活跃错误查询
CREATE INDEX IF NOT EXISTS idx_error_active
ON agent_error_record(session_id, error_type, timestamp DESC)
WHERE resolution = 'pending';

-- CollaborationEvent 时间范围查询优化
CREATE INDEX IF NOT EXISTS idx_collab_time_range
ON collaboration_event(session_id, timestamp DESC);

-- UserInteractionMetricEvent 聚合分析优化
CREATE INDEX IF NOT EXISTS idx_metric_analytics
ON user_interaction_metric_event(event_type, timestamp)
WHERE opted_in = TRUE;

-- 全文搜索索引（PostgreSQL gin索引用于JSONB）
CREATE INDEX IF NOT EXISTS idx_decision_reasoning_gin
ON decision_record USING gin(reasoning);

CREATE INDEX IF NOT EXISTS idx_metric_context_gin
ON user_interaction_metric_event USING gin(context);
