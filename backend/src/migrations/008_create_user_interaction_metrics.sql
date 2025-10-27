-- Migration: 008_create_user_interaction_metrics.sql
-- Description: 创建用户交互指标事件表

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
  opted_in BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_metric_type_time ON user_interaction_metric_event(event_type, timestamp DESC);
CREATE INDEX idx_metric_session ON user_interaction_metric_event(anonymous_session_id);
CREATE INDEX idx_metric_opted_in ON user_interaction_metric_event(opted_in);
CREATE INDEX idx_metric_timestamp ON user_interaction_metric_event(timestamp DESC);
