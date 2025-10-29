# Data Model: AI原生平台核心转型

**Feature**: 001-ai-native-transformation
**Date**: 2025-10-28
**Database**: PostgreSQL 15+
**ORM**: Sequelize / Prisma (待定)

## Overview

本文档定义AI原生平台的核心数据模型，涵盖10个主要实体及其关系。设计遵循第三范式（3NF）以减少冗余，同时使用JSONB字段存储灵活的Agent输出数据。

---

## Entity Relationship Diagram

```
┌──────────┐         ┌──────────┐         ┌───────────┐
│   User   │────1:N──│ Project  │────1:N──│  Version  │
└──────────┘         └──────────┘         └───────────┘
                           │
                          1:N
                           │
           ┌───────────────┼───────────────┬──────────────┐
           │               │               │              │
       ┌───▼────┐     ┌────▼───┐     ┌────▼─────┐  ┌────▼────┐
       │ Agent  │     │  Task  │     │Component │  │DataModel│
       └───┬────┘     └────┬───┘     └──────────┘  └─────────┘
           │               │
          1:N             1:N
           │               │
     ┌─────▼──────┐   ┌───▼────────┐
     │ BuildLog   │   │APIEndpoint │
     └────────────┘   └────────────┘
                           │
                          1:N
                           │
                      ┌────▼──────┐
                      │Deployment │
                      └───────────┘
```

---

## Core Entities

### 1. User (用户)

**用途**: 存储平台用户的身份信息和订阅状态

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- 订阅信息
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMP,

  -- 资源配额
  quota_projects_per_month INT DEFAULT 5,
  quota_api_calls_per_hour INT DEFAULT 10,
  quota_storage_mb INT DEFAULT 100,

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  -- 索引
  INDEX idx_users_email (email),
  INDEX idx_users_subscription (subscription_tier, subscription_expires_at)
);
```

**字段说明**:
- `subscription_tier`: 订阅级别，影响配额和功能访问
- `quota_*`: 资源配额限制，根据订阅级别设置
- 密码使用bcrypt或argon2哈希存储

**业务规则**:
- Email必须唯一且格式有效
- 订阅过期后降级到free级别
- 配额重置周期：projects按月，API calls按小时

---

### 2. Project (项目)

**用途**: 表示用户创建的应用项目

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 基本信息
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- 原始需求
  requirement_text TEXT NOT NULL,
  requirement_summary JSONB,  -- AI生成的理解摘要

  -- 状态
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft',           -- 需求确认中
    'building',        -- Agent构建中
    'built',           -- 构建完成
    'deployed',        -- 已部署
    'failed',          -- 构建失败
    'archived'         -- 已归档
  )),

  -- 构建信息
  build_started_at TIMESTAMP,
  build_completed_at TIMESTAMP,
  build_duration_seconds INT,  -- 构建耗时

  -- 生成的资源
  generated_code_url VARCHAR(500),  -- S3/MinIO对象存储URL
  preview_url VARCHAR(500),         -- 预览环境URL

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_projects_user (user_id, created_at DESC),
  INDEX idx_projects_status (status)
);
```

**字段说明**:
- `requirement_summary`: JSONB存储AI理解的结构化需求（模块、功能、数据实体）
- `generated_code_url`: 指向对象存储的代码压缩包
- 状态流转：draft → building → built → deployed

**业务规则**:
- 一个用户可创建多个项目（受配额限制）
- 项目名称在同一用户下不可重复
- `build_duration_seconds`用于性能统计和SC指标验证

---

### 3. Agent (代理)

**用途**: 存储Agent的运行时状态和性能指标

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Agent类型
  agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN (
    'ui', 'backend', 'database', 'integration', 'deployment'
  )),

  -- 状态
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN (
    'idle',         -- 空闲
    'working',      -- 工作中
    'waiting',      -- 等待依赖
    'completed',    -- 已完成
    'failed'        -- 失败
  )),

  -- 当前任务
  current_task_id UUID REFERENCES tasks(id),
  current_task_description TEXT,
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),

  -- 输出结果
  output JSONB,  -- Agent生成的结构化输出

  -- 性能指标
  tasks_completed INT DEFAULT 0,
  tasks_failed INT DEFAULT 0,
  total_execution_time_ms BIGINT DEFAULT 0,
  avg_task_time_ms INT,  -- 计算字段

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_agents_project (project_id, agent_type),
  INDEX idx_agents_status (status),
  UNIQUE (project_id, agent_type)  -- 每个项目每种Agent只有一个实例
);
```

**字段说明**:
- `output`: JSONB存储不同Agent的输出格式（UI布局、API定义、数据模型等）
- `avg_task_time_ms`: 用于SC-011验证（Agent响应时间中位数<3秒）
- 每个项目有5个Agent实例（ui, backend, database, integration, deployment）

**业务规则**:
- 同一项目的同类型Agent唯一
- `progress_percentage`通过WebSocket实时推送到前端
- `output`字段格式由Agent类型决定（见下方Agent输出格式）

**Agent输出格式示例**:

```json
// UIAgent输出
{
  "pages": [
    {
      "name": "Dashboard",
      "route": "/dashboard",
      "components": [
        {"type": "Header", "props": {...}},
        {"type": "StatCard", "props": {...}}
      ]
    }
  ],
  "theme": {"primaryColor": "#1890ff", ...}
}

// DatabaseAgent输出
{
  "entities": [
    {
      "name": "User",
      "fields": [{"name": "id", "type": "uuid", ...}],
      "relationships": [...]
    }
  ],
  "migrations": ["CREATE TABLE users..."]
}
```

---

### 4. Task (任务)

**用途**: Agent执行的工作单元

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- 任务信息
  task_type VARCHAR(50) NOT NULL,  -- 如: 'parse-requirements', 'generate-ui'
  description TEXT NOT NULL,

  -- 依赖关系
  depends_on UUID[] DEFAULT ARRAY[]::UUID[],  -- 依赖的其他任务ID

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  )),

  -- 执行信息
  input JSONB,   -- 任务输入参数
  output JSONB,  -- 任务输出结果
  error JSONB,   -- 失败时的错误信息

  -- 性能
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  execution_time_ms INT,  -- 执行耗时（毫秒）
  retry_count INT DEFAULT 0,

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_tasks_project (project_id, created_at DESC),
  INDEX idx_tasks_agent (agent_id, status),
  INDEX idx_tasks_status (status)
);
```

**字段说明**:
- `depends_on`: 数组存储依赖的任务ID，用于DAG调度
- `retry_count`: 失败重试次数（最多3次）
- `execution_time_ms`: 用于性能监控和SC验证

**业务规则**:
- 任务状态流转：pending → running → completed/failed
- 依赖任务全部完成后才能开始执行
- 失败任务自动重试，超过3次标记为permanently failed

---

### 5. Component (UI组件)

**用途**: 存储AI生成的UI组件定义

```sql
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 组件信息
  component_type VARCHAR(50) NOT NULL,  -- 如: 'Page', 'Form', 'Table'
  component_name VARCHAR(100) NOT NULL,

  -- 配置
  props JSONB NOT NULL,        -- 组件属性
  styles JSONB,                -- 样式配置
  data_bindings JSONB,         -- 数据绑定（字段→数据源）
  event_handlers JSONB,        -- 事件处理（onClick→API调用）

  -- 层级关系
  parent_id UUID REFERENCES components(id),
  order_index INT DEFAULT 0,   -- 同级组件的顺序

  -- 生成信息
  generated_by_agent UUID REFERENCES agents(id),
  generation_prompt TEXT,      -- AI生成时的提示词（调试用）

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_components_project (project_id),
  INDEX idx_components_parent (parent_id, order_index)
);
```

**字段说明**:
- `data_bindings`: 如 `{"username": "user.name", "email": "user.email"}`
- `event_handlers`: 如 `{"onClick": {"type": "api", "endpoint": "/api/users"}}`
- `parent_id`: 支持组件树结构（Page > Section > Form > Input）

---

### 6. DataModel (数据模型)

**用途**: 存储DatabaseAgent设计的数据库模型

```sql
CREATE TABLE data_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 实体信息
  entity_name VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- 字段定义
  fields JSONB NOT NULL,  -- [{name, type, constraints, default}]

  -- 关系定义
  relationships JSONB,    -- [{type, target_entity, foreign_key}]

  -- 索引定义
  indexes JSONB,          -- [{fields, type, unique}]

  -- 迁移脚本
  migration_up SQL,       -- CREATE TABLE脚本
  migration_down SQL,     -- DROP TABLE脚本

  -- 生成信息
  generated_by_agent UUID REFERENCES agents(id),

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_datamodels_project (project_id),
  UNIQUE (project_id, entity_name)
);
```

**字段示例**:

```json
// fields
[
  {"name": "id", "type": "uuid", "constraints": ["PRIMARY KEY"], "default": "gen_random_uuid()"},
  {"name": "username", "type": "varchar(100)", "constraints": ["NOT NULL", "UNIQUE"]},
  {"name": "email", "type": "varchar(255)", "constraints": ["NOT NULL"]}
]

// relationships
[
  {"type": "one-to-many", "target": "Order", "foreign_key": "user_id"}
]
```

---

### 7. APIEndpoint (API端点)

**用途**: 存储BackendAgent生成的API定义

```sql
CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 端点信息
  method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path VARCHAR(200) NOT NULL,
  description TEXT,

  -- 请求/响应格式
  request_schema JSONB,   -- JSON Schema格式
  response_schema JSONB,  -- JSON Schema格式

  -- 业务逻辑
  business_logic TEXT,    -- 伪代码或TypeScript代码

  -- 关联的数据模型
  related_models UUID[] DEFAULT ARRAY[]::UUID[],  -- 引用的DataModel ID

  -- 认证要求
  requires_auth BOOLEAN DEFAULT true,
  required_roles VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],

  -- 生成信息
  generated_by_agent UUID REFERENCES agents(id),

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_apiendpoints_project (project_id),
  UNIQUE (project_id, method, path)
);
```

**字段示例**:

```json
// request_schema
{
  "type": "object",
  "properties": {
    "username": {"type": "string", "minLength": 3},
    "email": {"type": "string", "format": "email"}
  },
  "required": ["username", "email"]
}

// business_logic
"1. Validate input data\n2. Check if username exists\n3. Hash password\n4. Insert into database\n5. Return user object"
```

---

### 8. Deployment (部署)

**用途**: 记录应用的部署历史

```sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 部署信息
  environment VARCHAR(20) NOT NULL CHECK (environment IN ('local', 'test', 'staging', 'production')),
  version VARCHAR(50) NOT NULL,  -- 如: 'v1.0.0' or git commit SHA

  -- 状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'building', 'deploying', 'success', 'failed', 'rollback'
  )),

  -- 配置
  config JSONB,  -- 部署配置（内存、CPU、副本数等）

  -- 日志
  build_log TEXT,
  deploy_log TEXT,
  error_log TEXT,

  -- 访问信息
  url VARCHAR(500),              -- 部署后的访问URL
  health_check_url VARCHAR(500),
  health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),

  -- 性能
  deployed_at TIMESTAMP,
  deployment_duration_seconds INT,

  -- 生成信息
  deployed_by_agent UUID REFERENCES agents(id),

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_deployments_project (project_id, created_at DESC),
  INDEX idx_deployments_env (environment, status)
);
```

**业务规则**:
- 部署状态流转：pending → building → deploying → success/failed
- `deployment_duration_seconds`用于SC-012验证（平均部署时间<5分钟）
- 失败部署可以触发自动rollback

---

### 9. Version (版本)

**用途**: 存储项目的版本快照

```sql
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- 版本信息
  version_number VARCHAR(50) NOT NULL,  -- 如: '1.0.0' 或自动递增编号
  description TEXT,

  -- 快照数据
  snapshot JSONB NOT NULL,  -- 完整的项目状态序列化

  -- 变更追踪
  changed_components UUID[] DEFAULT ARRAY[]::UUID[],
  changed_data_models UUID[] DEFAULT ARRAY[]::UUID[],
  changed_api_endpoints UUID[] DEFAULT ARRAY[]::UUID[],

  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_user UUID REFERENCES users(id),

  -- 索引
  INDEX idx_versions_project (project_id, created_at DESC),
  UNIQUE (project_id, version_number)
);
```

**字段说明**:
- `snapshot`: 完整的项目状态，包含所有Component、DataModel、APIEndpoint的配置
- 用于版本回滚功能（FR-018）

---

### 10. BuildLog (构建日志)

**用途**: 记录构建过程的详细日志

```sql
CREATE TABLE build_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),

  -- 日志信息
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error')),
  message TEXT NOT NULL,

  -- 来源
  source VARCHAR(50) NOT NULL,  -- 如: 'UIAgent', 'AgentOrchestrator'

  -- 上下文
  context JSONB,  -- 额外的结构化信息

  -- 时间
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_buildlogs_project (project_id, timestamp DESC),
  INDEX idx_buildlogs_level (level, timestamp DESC)
) PARTITION BY RANGE (timestamp);  -- 按时间分区

-- 分区示例（每月一个分区）
CREATE TABLE build_logs_2025_10 PARTITION OF build_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

**字段说明**:
- 按时间分区以支持大规模日志（满足FR-026审计需求）
- `context`存储额外信息（如AI提示词、响应片段）

---

## Data Access Patterns

### 常见查询及索引优化

```sql
-- 1. 获取用户的所有项目（按创建时间倒序）
-- 使用索引: idx_projects_user
SELECT * FROM projects
WHERE user_id = ? AND status != 'archived'
ORDER BY created_at DESC
LIMIT 20;

-- 2. 获取项目的所有Agent状态（WebSocket推送）
-- 使用索引: idx_agents_project
SELECT agent_type, status, progress_percentage, current_task_description
FROM agents
WHERE project_id = ?;

-- 3. 获取Agent的任务队列
-- 使用索引: idx_tasks_agent
SELECT * FROM tasks
WHERE agent_id = ? AND status IN ('pending', 'running')
ORDER BY created_at ASC;

-- 4. 构建日志查询（分区裁剪）
-- 使用索引: idx_buildlogs_project + 分区
SELECT * FROM build_logs
WHERE project_id = ? AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 100;
```

---

## Migration Strategy

### 初始迁移

```bash
# 使用Prisma或Sequelize生成迁移
npx prisma migrate dev --name init

# 或手动执行SQL脚本
psql -d ai_builder_db -f migrations/001_init.sql
```

### 版本演进

- 使用工具管理迁移（Prisma Migrate / Flyway / Liquibase）
- 每个迁移文件包含UP和DOWN脚本
- 生产环境迁移前在staging验证
- 支持零停机迁移（先加字段，再填充，最后删除旧字段）

---

## Performance Considerations

### 索引策略

- **主键**: 所有表使用UUID主键（分布式友好）
- **外键**: 所有外键字段添加索引
- **查询路径**: 按常见查询模式添加复合索引
- **JSONB**: 对JSONB字段的常用路径创建GIN索引

```sql
-- JSONB字段索引示例
CREATE INDEX idx_agents_output_gin ON agents USING GIN (output);

-- 查询示例
SELECT * FROM agents WHERE output @> '{"ui_type": "dashboard"}';
```

### 分区策略

- **大表分区**: BuildLog按月分区（避免单表过大）
- **自动清理**: 定期归档或删除90天前的日志
- **查询优化**: 查询时指定时间范围以利用分区裁剪

---

## Security & Compliance

### Row Level Security (RLS)

```sql
-- 启用RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能访问自己的项目
CREATE POLICY project_access ON projects
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- 应用层设置当前用户
SET app.current_user_id = 'user-uuid-here';
```

### 数据加密

- **传输加密**: 强制SSL连接（`sslmode=require`）
- **静态加密**: 敏感字段（如API密钥）使用pgcrypto加密
- **备份加密**: 数据库备份使用AES-256加密

---

## 下一步

✅ 数据模型设计完成
📄 继续生成 API契约（OpenAPI规范）

**预计剩余时间**: 5-10分钟
