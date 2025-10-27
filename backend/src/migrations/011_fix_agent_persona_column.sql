-- Migration: 007_fix_agent_persona_column.sql
-- Description: 修复 agent_persona 表的 personality_tone 字段长度

ALTER TABLE agent_persona
ALTER COLUMN personality_tone TYPE VARCHAR(50);
