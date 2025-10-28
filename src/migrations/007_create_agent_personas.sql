-- Migration: 007_create_agent_personas.sql
-- Description: 创建Agent拟人化配置表

CREATE TABLE IF NOT EXISTS agent_persona (
  agent_type VARCHAR(50) PRIMARY KEY CHECK (agent_type IN ('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent')),
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NOT NULL,
  status_template VARCHAR(200) NOT NULL,
  color_theme VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'low')),
  personality_tone VARCHAR(20) NOT NULL DEFAULT 'professional_friendly',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 注释
COMMENT ON TABLE agent_persona IS 'Agent拟人化配置表 - 定义Agent展示属性';
COMMENT ON COLUMN agent_persona.display_name IS '显示名称，如"UI设计师"';
COMMENT ON COLUMN agent_persona.status_template IS '状态消息模板: {agent_name}正在{task_description}...';
COMMENT ON COLUMN agent_persona.priority IS 'high(200-500ms推送), low(1-2s推送)';
COMMENT ON COLUMN agent_persona.personality_tone IS '性格语气: professional_friendly';
