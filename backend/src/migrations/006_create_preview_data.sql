-- Migration: 006_create_preview_data.sql
-- Description: 创建预览数据表

CREATE TABLE IF NOT EXISTS preview_data (
  preview_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decision_record(decision_id) ON DELETE CASCADE,
  preview_type VARCHAR(50) NOT NULL CHECK (preview_type IN ('image', 'html', 'json', 'diagram')),
  preview_content TEXT NOT NULL,
  title VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_preview_decision ON preview_data(decision_id);
CREATE INDEX idx_preview_type ON preview_data(preview_type);
