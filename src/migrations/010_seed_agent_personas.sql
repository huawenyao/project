-- Migration: 010_seed_agent_personas.sql
-- Description: 插入预定义的Agent拟人化配置数据

INSERT INTO agent_persona (agent_type, display_name, avatar_url, status_template, color_theme, priority, personality_tone)
VALUES
  (
    'UIAgent',
    'UI设计师',
    '/avatars/ui-agent.png',
    '{agent_name}正在{task_description}',
    '#3B82F6',
    'high',
    'professional_friendly'
  ),
  (
    'BackendAgent',
    '后端开发师',
    '/avatars/backend-agent.png',
    '{agent_name}正在{task_description}',
    '#10B981',
    'high',
    'professional_friendly'
  ),
  (
    'DatabaseAgent',
    '数据架构师',
    '/avatars/database-agent.png',
    '{agent_name}正在{task_description}',
    '#8B5CF6',
    'high',
    'professional_friendly'
  ),
  (
    'IntegrationAgent',
    '集成专家',
    '/avatars/integration-agent.png',
    '{agent_name}正在{task_description}',
    '#F59E0B',
    'low',
    'professional_friendly'
  ),
  (
    'DeploymentAgent',
    '部署工程师',
    '/avatars/deployment-agent.png',
    '{agent_name}正在{task_description}',
    '#EF4444',
    'low',
    'professional_friendly'
  )
ON CONFLICT (agent_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  status_template = EXCLUDED.status_template,
  color_theme = EXCLUDED.color_theme,
  priority = EXCLUDED.priority,
  personality_tone = EXCLUDED.personality_tone,
  updated_at = NOW();

-- 注释
COMMENT ON CONSTRAINT agent_persona_pkey ON agent_persona IS '5个Agent类型的预定义配置';
