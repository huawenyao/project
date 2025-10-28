-- Migration: 008_create_user_interaction_metrics.sql
-- Description: 创建用户交互指标表（匿名化）

CREATE TABLE IF NOT EXISTS user_interaction_metric_event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'decision_card_click', 'decision_expand', 'agent_card_interaction',
    'replay_usage', 'theme_switch', 'focus_mode_toggle',
    'build_abandon', 'error_recovery_action'
  )),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  anonymous_session_id VARCHAR(100) NOT NULL,
  context JSONB,
  opted_in BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_metric_type_time ON user_interaction_metric_event(event_type, timestamp DESC);
CREATE INDEX idx_metric_session ON user_interaction_metric_event(anonymous_session_id);
CREATE INDEX idx_metric_opted_in ON user_interaction_metric_event(opted_in);
CREATE INDEX idx_metric_timestamp ON user_interaction_metric_event(timestamp DESC);

-- 注释
COMMENT ON TABLE user_interaction_metric_event IS '用户交互指标事件表 - 匿名化数据收集';
COMMENT ON COLUMN user_interaction_metric_event.anonymous_session_id IS '匿名会话ID（不关联真实用户）';
COMMENT ON COLUMN user_interaction_metric_event.context IS '上下文信息（不含PII）';
COMMENT ON COLUMN user_interaction_metric_event.opted_in IS '用户是否选择加入数据收集';
