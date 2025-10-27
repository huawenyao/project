-- Migration: 007_create_agent_personas.sql
-- Description: 创建 Agent 拟人化配置表

CREATE TABLE IF NOT EXISTS agent_persona (
  agent_type VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NOT NULL,
  status_template VARCHAR(200) NOT NULL,
  color_theme VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'low')),
  personality_tone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_agent_persona_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_persona_updated
BEFORE UPDATE ON agent_persona
FOR EACH ROW
EXECUTE FUNCTION update_agent_persona_timestamp();
