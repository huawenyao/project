# Data Model: AI思考过程可视化系统

**Feature**: 002-ai-thinking-visualization
**Created**: 2025-10-27
**Database**: PostgreSQL (热数据) + 对象存储/S3 (冷数据归档)
**Version**: 1.0

---

## 目录

- [架构概览](#架构概览)
- [实体关系图](#实体关系图)
- [核心实体定义](#核心实体定义)
  - [1. BuildSession (构建会话)](#1-buildsession-构建会话)
  - [2. AgentWorkStatus (Agent工作状态)](#2-agentworkstatus-agent工作状态)
  - [3. DecisionRecord (决策记录)](#3-decisionrecord-决策记录)
  - [4. AgentErrorRecord (Agent错误记录)](#4-agenterrorrecord-agent错误记录)
  - [5. CollaborationEvent (协作事件)](#5-collaborationevent-协作事件)
  - [6. PreviewData (预览数据)](#6-previewdata-预览数据)
  - [7. AgentPersona (Agent拟人化配置)](#7-agentpersona-agent拟人化配置)
  - [8. UserInteractionMetricEvent (用户交互指标事件)](#8-userinteractionmetricevent-用户交互指标事件)
- [数据生命周期管理](#数据生命周期管理)
- [查询模式与索引优化](#查询模式与索引优化)
- [数据库迁移策略](#数据库迁移策略)

---

## 架构概览

### 数据分层架构

```
┌─────────────────────────────────────────────────────────┐
│                  前端可视化层                             │
│        (实时展示 + WebSocket推送)                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              后端API层 + WebSocket服务                    │
│        (AgentOrchestrator, 状态推送)                     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│          PostgreSQL 主数据库 (热数据)                     │
│     - BuildSession (最近30天)                            │
│     - AgentWorkStatus, DecisionRecord                   │
│     - CollaborationEvent, AgentErrorRecord              │
│     - PreviewData                                       │
│     - UserInteractionMetricEvent (聚合)                 │
└─────────────────┬───────────────────────────────────────┘
                  │ (自动归档任务, 每日执行)
┌─────────────────▼───────────────────────────────────────┐
│          对象存储/S3 (冷数据归档)                         │
│     - 归档的完整构建会话 (>30天)                          │
│     - JSON格式压缩存储                                    │
│     - 按需加载供历史回放                                  │
└─────────────────────────────────────────────────────────┘
```

### 数据流向

1. **实时数据流**: Agent执行 → 状态更新 → PostgreSQL → WebSocket推送 → 前端实时展示
2. **归档数据流**: PostgreSQL (>30天) → 后台任务 → 导出JSON → S3存储 → 删除主库详细数据
3. **回放数据流**: 用户请求历史 → 检查归档状态 → S3加载(如需) → 前端回放展示

---

## 实体关系图

```
┌──────────────────┐
│   BuildSession   │ (构建会话 - 核心聚合根)
│ ──────────────── │
│ PK: session_id   │
│     user_id      │
│     project_id   │
│     start_time   │◄──────────────┐
│     end_time     │                │
│     status       │                │
│     archived     │                │
└────────┬─────────┘                │
         │                          │
         │ 1:N                      │
         │                          │
    ┌────▼──────────────────┐       │
    │                       │       │
┌───▼──────────────┐  ┌────▼──────────────┐  ┌─────────────────┐
│ AgentWorkStatus  │  │  DecisionRecord   │  │ CollaborationEv │
│ ───────────────  │  │  ───────────────  │  │ ──────────────  │
│ PK: status_id    │  │ PK: decision_id   │  │ PK: event_id    │
│ FK: session_id   │  │ FK: session_id    │  │ FK: session_id  │
│     agent_id     │  │     agent_id      │  │     source_id   │
│     agent_type   │  │     title         │  │     target_id   │
│     status       │  │     importance    │  │     data_type   │
│     progress     │  │     timestamp     │  │     timestamp   │
│     retry_count  │  └─────┬─────────────┘  └─────────────────┘
└──────┬───────────┘        │
       │ 1:N                │ 1:N
       │                    │
┌──────▼───────────┐  ┌─────▼─────────┐
│ AgentErrorRecord │  │  PreviewData  │
│ ────────────────│  │  ────────────  │
│ PK: error_id     │  │ PK: preview_id│
│ FK: agent_id     │  │ FK: decision_ │
│ FK: session_id   │  │     id        │
│     error_type   │  │     type      │
│     message      │  │     content   │
│     timestamp    │  │               │
└──────────────────┘  └───────────────┘

┌──────────────────┐         ┌──────────────────────────┐
│  AgentPersona    │         │ UserInteractionMetric    │
│  ──────────────  │         │ Event                    │
│ PK: agent_type   │         │ ────────────────────────│
│     name         │         │ PK: event_id             │
│     avatar_url   │         │     event_type           │
│     priority     │         │     timestamp            │
│     color        │         │     anonymous_session_id │
└──────────────────┘         │     context (JSONB)      │
(配置表, 预加载)              └──────────────────────────┘
```

---

## 核心实体定义

### 1. BuildSession (构建会话)

**描述**: 表示一次完整的应用构建过程，作为所有相关事件的聚合根。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `session_id` | UUID | PRIMARY KEY | 会话唯一标识 |
| `user_id` | UUID | NOT NULL, INDEX | 关联用户ID |
| `project_id` | UUID | NOT NULL, INDEX | 关联项目ID |
| `start_time` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 构建开始时间 |
| `end_time` | TIMESTAMP | NULL | 构建结束时间 |
| `status` | VARCHAR(20) | NOT NULL, CHECK | 总体状态: `in_progress`, `success`, `failed`, `partial_success` |
| `agent_list` | JSONB | NOT NULL | 参与的Agent列表 `[{agent_id, agent_type}]` |
| `archived` | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否已归档 |
| `archived_at` | TIMESTAMP | NULL | 归档时间戳 |
| `storage_path` | VARCHAR(500) | NULL | 对象存储路径 (S3 key) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录更新时间 |

#### 索引

```sql
CREATE INDEX idx_build_session_user_time ON build_session(user_id, start_time DESC);
CREATE INDEX idx_build_session_project ON build_session(project_id);
CREATE INDEX idx_build_session_archived ON build_session(archived, start_time DESC);
CREATE INDEX idx_build_session_status ON build_session(status);
```

#### 状态机

```
in_progress ──┐
              ├──> success
              ├──> failed
              └──> partial_success
```

**状态转换规则**:
- `in_progress`: 初始状态，至少有一个Agent正在工作
- `success`: 所有Agent完成且无关键错误
- `failed`: 任意关键错误导致构建终止
- `partial_success`: 部分Agent成功，部分被跳过

#### 生命周期

1. **热数据期** (0-30天): 完整数据保存在PostgreSQL，快速访问
2. **归档期** (>30天):
   - 详细事件数据导出为JSON压缩文件存储到S3
   - PostgreSQL仅保留元数据 (session_id, user_id, project_id, 时间, 状态)
   - 设置 `archived = TRUE`, `storage_path = 's3://bucket/path/to/session.json.gz'`

---

### 2. AgentWorkStatus (Agent工作状态)

**描述**: 记录单个Agent在某个时间点的工作状态，支持实时更新和进度跟踪。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `status_id` | UUID | PRIMARY KEY | 状态记录唯一标识 |
| `session_id` | UUID | NOT NULL, FK → BuildSession | 所属构建会话 |
| `agent_id` | VARCHAR(100) | NOT NULL, INDEX | Agent实例ID |
| `agent_type` | VARCHAR(50) | NOT NULL | Agent类型: `UIAgent`, `BackendAgent`, `DatabaseAgent`, `IntegrationAgent`, `DeploymentAgent` |
| `status` | VARCHAR(20) | NOT NULL, CHECK | 当前状态: `pending`, `in_progress`, `completed`, `failed`, `retrying`, `skipped` |
| `task_description` | VARCHAR(500) | NULL | 当前任务描述 (50-200字符) |
| `progress_percentage` | SMALLINT | NOT NULL, CHECK (0-100) | 进度百分比 |
| `start_time` | TIMESTAMP | NULL | Agent开始时间 |
| `end_time` | TIMESTAMP | NULL | Agent结束时间 |
| `retry_count` | SMALLINT | NOT NULL, DEFAULT 0 | 当前重试次数 |
| `max_retry` | SMALLINT | NOT NULL, DEFAULT 3 | 最大重试次数 |
| `last_error` | TEXT | NULL | 最后错误信息 (简要) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录更新时间 |

#### 索引

```sql
CREATE INDEX idx_agent_status_session ON agent_work_status(session_id, agent_type);
CREATE INDEX idx_agent_status_agent_id ON agent_work_status(agent_id);
CREATE INDEX idx_agent_status_status ON agent_work_status(status);
CREATE INDEX idx_agent_status_updated ON agent_work_status(updated_at DESC);
```

#### 状态机

```
pending ──> in_progress ──┬──> completed
                          │
                          ├──> failed ──> retrying ──┐
                          │                          │
                          └──────────────────────────┴──> skipped
```

**状态转换规则**:
- `pending → in_progress`: Agent启动执行
- `in_progress → completed`: 任务成功完成
- `in_progress → failed`: 遇到错误
- `failed → retrying`: 轻微错误自动重试
- `failed/retrying → skipped`: 用户选择跳过
- `retrying → completed`: 重试成功
- `retrying → failed`: 重试3次后仍失败

#### WebSocket推送策略

根据Agent优先级决定推送频率（参考 `AgentPersona.priority`）:
- **高优先级** (UIAgent, BackendAgent, DatabaseAgent): 状态变化后 200-500ms 推送
- **低优先级** (DeploymentAgent, IntegrationAgent): 状态变化后 1-2s 推送
- **关键状态** (failed, completed): 立即推送 (<100ms)

---

### 3. DecisionRecord (决策记录)

**描述**: 记录Agent在构建过程中做出的关键决策，用于透明化AI推理过程。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `decision_id` | UUID | PRIMARY KEY | 决策唯一标识 |
| `session_id` | UUID | NOT NULL, FK → BuildSession | 所属构建会话 |
| `agent_id` | VARCHAR(100) | NOT NULL, INDEX | 做出决策的Agent ID |
| `agent_type` | VARCHAR(50) | NOT NULL | Agent类型 |
| `title` | VARCHAR(200) | NOT NULL | 决策标题 |
| `content` | TEXT | NOT NULL | 决策内容描述 |
| `reasoning` | JSONB | NOT NULL | 决策理由 (数组: `["理由1", "理由2", ...]`) |
| `alternatives` | JSONB | NULL | 备选方案列表 `[{name, description}]` |
| `tradeoffs` | TEXT | NULL | 选择该方案的优势和权衡 |
| `importance` | VARCHAR(10) | NOT NULL, CHECK | 重要性级别: `high`, `medium`, `low` |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE | 用户是否已读 |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 决策时间戳 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |

#### 索引

```sql
CREATE INDEX idx_decision_session ON decision_record(session_id, timestamp DESC);
CREATE INDEX idx_decision_agent ON decision_record(agent_id);
CREATE INDEX idx_decision_importance ON decision_record(importance, is_read);
CREATE INDEX idx_decision_unread ON decision_record(session_id, is_read) WHERE is_read = FALSE;
```

#### 展示策略

根据 `importance` 字段决定展示方式 (FR-007):
- **high**: 右下角toast通知 (显示5秒) + 侧边栏未读标记
- **medium/low**: 仅侧边栏未读标记 (数字角标)

#### 关联关系

- 1:N 关联到 `PreviewData` (一个决策可有多个预览)

---

### 4. AgentErrorRecord (Agent错误记录)

**描述**: 记录Agent执行过程中发生的所有错误和重试历史。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `error_id` | UUID | PRIMARY KEY | 错误唯一标识 |
| `session_id` | UUID | NOT NULL, FK → BuildSession | 所属构建会话 |
| `agent_id` | VARCHAR(100) | NOT NULL, INDEX | 发生错误的Agent ID |
| `agent_type` | VARCHAR(50) | NOT NULL | Agent类型 |
| `error_type` | VARCHAR(50) | NOT NULL, CHECK | 错误类型: `minor`, `critical` |
| `error_category` | VARCHAR(100) | NOT NULL | 错误分类: `network_timeout`, `api_rate_limit`, `decision_failure`, `service_unavailable`, `data_validation_error` 等 |
| `message` | TEXT | NOT NULL | 用户可读错误消息 |
| `technical_details` | TEXT | NULL | 技术详情 (堆栈跟踪) |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 错误发生时间 |
| `retry_attempts` | SMALLINT | NOT NULL, DEFAULT 0 | 已尝试重试次数 |
| `resolution` | VARCHAR(50) | NULL, CHECK | 最终处理方式: `auto_retry_success`, `user_retry`, `user_skip`, `user_abort`, `pending` |
| `resolved_at` | TIMESTAMP | NULL | 解决时间戳 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |

#### 索引

```sql
CREATE INDEX idx_error_session ON agent_error_record(session_id, timestamp DESC);
CREATE INDEX idx_error_agent ON agent_error_record(agent_id);
CREATE INDEX idx_error_type ON agent_error_record(error_type, error_category);
CREATE INDEX idx_error_unresolved ON agent_error_record(resolution) WHERE resolution = 'pending';
```

#### 错误类型分类

**轻微错误 (minor)**: 自动重试最多3次
- `network_timeout`: 网络超时
- `api_rate_limit`: API限流
- `service_unavailable`: 临时服务不可用

**关键错误 (critical)**: 立即暂停，等待用户确认
- `decision_failure`: 决策生成失败
- `service_missing`: 依赖服务缺失
- `data_validation_error`: 数据验证错误

#### 重试策略 (FR-015)

- **指数退避**: 1s → 2s → 4s
- **最大重试**: 3次
- **用户操作**: 重试 / 跳过 / 终止构建

---

### 5. CollaborationEvent (协作事件)

**描述**: 记录Agent之间的协作和数据传递，用于可视化协作流程。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `event_id` | UUID | PRIMARY KEY | 事件唯一标识 |
| `session_id` | UUID | NOT NULL, FK → BuildSession | 所属构建会话 |
| `source_agent_id` | VARCHAR(100) | NOT NULL | 源Agent ID |
| `source_agent_type` | VARCHAR(50) | NOT NULL | 源Agent类型 |
| `target_agent_id` | VARCHAR(100) | NOT NULL | 目标Agent ID |
| `target_agent_type` | VARCHAR(50) | NOT NULL | 目标Agent类型 |
| `data_summary` | TEXT | NOT NULL | 传递内容摘要 (如 "包含3个表: users, projects, tasks") |
| `data_type` | VARCHAR(100) | NOT NULL | 数据类型: `schema`, `api_definition`, `ui_config`, `deployment_manifest` 等 |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 协作事件时间戳 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |

#### 索引

```sql
CREATE INDEX idx_collab_session ON collaboration_event(session_id, timestamp);
CREATE INDEX idx_collab_source ON collaboration_event(source_agent_id);
CREATE INDEX idx_collab_target ON collaboration_event(target_agent_id);
CREATE INDEX idx_collab_flow ON collaboration_event(source_agent_type, target_agent_type);
```

#### 可视化展示

- **列表视图**: 缩进 + 简化箭头 (→) 显示数据流向
- **图形视图**: 动画连线，数据流动时显示移动的小圆点

---

### 6. PreviewData (预览数据)

**描述**: 存储决策的可视化预览内容，支持实时影响预测。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `preview_id` | UUID | PRIMARY KEY | 预览唯一标识 |
| `decision_id` | UUID | NOT NULL, FK → DecisionRecord | 关联的决策ID |
| `preview_type` | VARCHAR(50) | NOT NULL, CHECK | 预览类型: `image`, `html`, `json`, `diagram` |
| `preview_content` | TEXT | NOT NULL | 预览内容 (URL或内联数据) |
| `title` | VARCHAR(200) | NULL | 预览标题 |
| `description` | TEXT | NULL | 预览描述 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |

#### 索引

```sql
CREATE INDEX idx_preview_decision ON preview_data(decision_id);
CREATE INDEX idx_preview_type ON preview_data(preview_type);
```

#### 预览类型说明

- **image**: 静态截图URL (如UI组件样式预览)
- **html**: 内联HTML片段 (如导航栏预览)
- **json**: JSON数据示例 (如API响应格式)
- **diagram**: 架构图或数据流图URL

---

### 7. AgentPersona (Agent拟人化配置)

**描述**: 定义每个Agent类型的拟人化属性和展示配置，用于增强用户情感连接。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `agent_type` | VARCHAR(50) | PRIMARY KEY | Agent类型标识 |
| `display_name` | VARCHAR(100) | NOT NULL | 显示名称 (如 "UI设计师") |
| `avatar_url` | VARCHAR(500) | NOT NULL | 头像图标URL |
| `status_template` | VARCHAR(200) | NOT NULL | 状态消息模板 (如 "{agent_name}正在{task_description}...") |
| `color_theme` | VARCHAR(20) | NOT NULL | 默认颜色主题 (十六进制色值) |
| `priority` | VARCHAR(10) | NOT NULL, CHECK | 更新频率优先级: `high`, `low` |
| `personality_tone` | VARCHAR(20) | NOT NULL | 性格语气: `professional_friendly` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录更新时间 |

#### 索引

```sql
CREATE UNIQUE INDEX idx_persona_type ON agent_persona(agent_type);
```

#### 预定义配置数据

| agent_type | display_name | priority | color_theme | 状态模板示例 |
|------------|--------------|----------|-------------|-------------|
| `UIAgent` | UI设计师 | `high` | `#3B82F6` | "UI设计师正在选择组件库..." |
| `BackendAgent` | 后端开发师 | `high` | `#10B981` | "后端开发师正在创建API接口..." |
| `DatabaseAgent` | 数据架构师 | `high` | `#8B5CF6` | "数据架构师正在设计表结构..." |
| `IntegrationAgent` | 集成专家 | `low` | `#F59E0B` | "集成专家正在配置第三方服务..." |
| `DeploymentAgent` | 部署工程师 | `low` | `#EF4444` | "部署工程师正在准备环境..." |

#### 性格语气规范 (FR-005)

**professional_friendly** (专业友好型):
- 使用专业但温暖的语言
- 关键里程碑时使用鼓励性表达 (如 "太棒了,UI组件已就绪!")
- 适度使用简洁符号 (✓, ✗, ⏳)
- 避免过度娱乐化 (禁止频繁emoji或俚语)

---

### 8. UserInteractionMetricEvent (用户交互指标事件)

**描述**: 记录匿名化的用户交互指标，用于产品分析和迭代优化，严格遵守隐私保护要求。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `event_id` | UUID | PRIMARY KEY | 事件唯一标识 |
| `event_type` | VARCHAR(100) | NOT NULL, CHECK | 事件类型 (见下表) |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 事件时间戳 |
| `anonymous_session_id` | VARCHAR(100) | NOT NULL, INDEX | 匿名会话ID (不关联用户) |
| `context` | JSONB | NULL | 相关上下文 (不含PII) |
| `opted_in` | BOOLEAN | NOT NULL | 用户是否选择加入数据收集 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 记录创建时间 |

#### 索引

```sql
CREATE INDEX idx_metric_type_time ON user_interaction_metric_event(event_type, timestamp DESC);
CREATE INDEX idx_metric_session ON user_interaction_metric_event(anonymous_session_id);
CREATE INDEX idx_metric_opted_in ON user_interaction_metric_event(opted_in);
CREATE INDEX idx_metric_timestamp ON user_interaction_metric_event(timestamp DESC);
```

#### 事件类型 (event_type)

| 事件类型 | 说明 | context 字段示例 |
|---------|------|------------------|
| `decision_card_click` | 决策卡片点击 | `{importance: "high", agent_type: "UIAgent"}` |
| `decision_expand` | 展开决策详情 | `{decision_importance: "medium"}` |
| `agent_card_interaction` | Agent卡片交互 | `{agent_type: "BackendAgent", interaction: "hover"}` |
| `replay_usage` | 回放功能使用 | `{session_age_days: 15}` |
| `theme_switch` | 主题切换 | `{from_theme: "warm", to_theme: "tech"}` |
| `focus_mode_toggle` | 专注模式切换 | `{enabled: true}` |
| `build_abandon` | 构建中途放弃 | `{progress_percentage: 45, active_agents: 3}` |
| `error_recovery_action` | 错误恢复操作 | `{error_type: "minor", action: "retry"}` |

#### 隐私保护措施 (FR-025)

1. **匿名化**:
   - 使用随机生成的 `anonymous_session_id`，不关联真实用户ID
   - `context` 字段禁止包含任何PII (姓名、邮箱、IP地址等)

2. **数据最小化**:
   - 仅收集产品改进必需的指标
   - 不记录鼠标移动轨迹、完整键盘输入等详细行为

3. **用户控制**:
   - `opted_in` 字段记录用户是否同意数据收集
   - 用户可随时在设置中退出 (opt-out)

4. **数据保留**:
   - 自动删除超过12个月的指标数据
   - 定期聚合分析，不保留原始事件详情

5. **合规性**:
   - 遵守GDPR、CCPA等隐私法规
   - 数据传输使用HTTPS加密
   - 不用于广告投放或第三方销售

---

## 数据生命周期管理

### 热数据与冷数据策略

#### 热数据期 (0-30天)

**存储**: PostgreSQL 主数据库
**访问**: 快速查询 (<500ms)
**完整性**: 包含所有详细事件数据

**包含实体**:
- BuildSession (完整)
- AgentWorkStatus (所有状态快照)
- DecisionRecord (所有决策)
- AgentErrorRecord (所有错误)
- CollaborationEvent (所有协作)
- PreviewData (所有预览)

#### 冷数据期 (>30天)

**触发**: 每日凌晨执行归档任务
**流程**:

```
1. 查询所有 start_time < (NOW() - 30天) 且 archived = FALSE 的 BuildSession
2. 对每个会话:
   a. 导出完整会话数据 (包括所有关联实体) 为JSON
   b. 压缩为 .json.gz 文件
   c. 上传到 S3: s3://bucket/archives/{year}/{month}/{session_id}.json.gz
   d. 更新 BuildSession:
      - archived = TRUE
      - archived_at = NOW()
      - storage_path = S3路径
   e. 删除详细事件数据 (AgentWorkStatus, DecisionRecord等)
   f. 保留 BuildSession 元数据记录
```

**保留字段** (PostgreSQL):
- `session_id`, `user_id`, `project_id`
- `start_time`, `end_time`, `status`
- `archived`, `archived_at`, `storage_path`

**访问**: 按需从S3加载 (<3s)

### 归档JSON格式

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "project_id": "uuid",
  "start_time": "ISO8601",
  "end_time": "ISO8601",
  "status": "success",
  "agent_list": [...],
  "agents": [
    {
      "agent_id": "...",
      "agent_type": "UIAgent",
      "statuses": [...],
      "errors": [...]
    }
  ],
  "decisions": [...],
  "collaborations": [...],
  "previews": [...]
}
```

### 数据清理策略

- **UserInteractionMetricEvent**: 保留12个月后自动删除
- **归档数据**: 保留3年后可选删除 (取决于存储成本和合规要求)

---

## 查询模式与索引优化

### 常见查询路径

#### 1. 实时可视化 - 获取当前构建状态

**查询频率**: 高 (WebSocket推送时)
**响应要求**: <100ms

```sql
-- 查询特定会话的所有Agent当前状态
SELECT
  agent_id, agent_type, status, task_description,
  progress_percentage, updated_at
FROM agent_work_status
WHERE session_id = $1
ORDER BY agent_type;

-- 索引: idx_agent_status_session (session_id, agent_type)
```

#### 2. 决策时间线 - 获取会话的所有决策

**查询频率**: 中等
**响应要求**: <200ms

```sql
-- 查询会话的所有决策，按时间倒序
SELECT
  d.decision_id, d.title, d.content, d.importance,
  d.is_read, d.timestamp, d.agent_type,
  p.preview_type, p.preview_content
FROM decision_record d
LEFT JOIN preview_data p ON d.decision_id = p.decision_id
WHERE d.session_id = $1
ORDER BY d.timestamp DESC;

-- 索引: idx_decision_session (session_id, timestamp DESC)
```

#### 3. 未读决策 - 侧边栏通知角标

**查询频率**: 高
**响应要求**: <50ms

```sql
-- 查询特定会话的未读决策数量
SELECT COUNT(*)
FROM decision_record
WHERE session_id = $1 AND is_read = FALSE;

-- 索引: idx_decision_unread (session_id, is_read) WHERE is_read = FALSE (部分索引)
```

#### 4. 错误日志 - 构建失败时展示

**查询频率**: 低
**响应要求**: <300ms

```sql
-- 查询会话的所有错误，按时间正序
SELECT
  error_id, agent_type, error_type, error_category,
  message, timestamp, retry_attempts, resolution
FROM agent_error_record
WHERE session_id = $1
ORDER BY timestamp ASC;

-- 索引: idx_error_session (session_id, timestamp DESC)
```

#### 5. 协作流程 - 图形视图渲染

**查询频率**: 中等 (视图切换时)
**响应要求**: <200ms

```sql
-- 查询会话的所有协作事件
SELECT
  source_agent_type, target_agent_type,
  data_summary, data_type, timestamp
FROM collaboration_event
WHERE session_id = $1
ORDER BY timestamp ASC;

-- 索引: idx_collab_session (session_id, timestamp)
```

#### 6. 历史记录列表 - 用户查看历史构建

**查询频率**: 中等
**响应要求**: <500ms (热数据)

```sql
-- 查询用户的所有构建会话 (包括已归档)
SELECT
  session_id, project_id, start_time, end_time,
  status, archived
FROM build_session
WHERE user_id = $1
ORDER BY start_time DESC
LIMIT 50;

-- 索引: idx_build_session_user_time (user_id, start_time DESC)
```

#### 7. 归档数据加载 - 回放历史构建

**查询频率**: 低
**响应要求**: <3s (冷数据)

```sql
-- 查询归档会话的存储路径
SELECT storage_path
FROM build_session
WHERE session_id = $1 AND archived = TRUE;

-- 索引: 主键 (session_id)
-- 后端逻辑: 从S3下载并解析JSON
```

#### 8. 用户交互指标聚合 - 产品分析

**查询频率**: 低 (定期聚合任务)
**响应要求**: <5s

```sql
-- 聚合决策卡片点击率 (最近30天)
SELECT
  event_type,
  context->>'importance' AS importance,
  COUNT(*) AS event_count
FROM user_interaction_metric_event
WHERE
  event_type IN ('decision_card_click', 'decision_expand')
  AND timestamp >= NOW() - INTERVAL '30 days'
  AND opted_in = TRUE
GROUP BY event_type, importance;

-- 索引: idx_metric_type_time (event_type, timestamp DESC)
```

### 索引总结

| 表名 | 索引数量 | 关键索引 | 预估大小 (1000会话) |
|------|----------|---------|---------------------|
| build_session | 4 | user_time, archived | ~100KB |
| agent_work_status | 4 | session, agent_id | ~5MB |
| decision_record | 4 | session, unread | ~3MB |
| agent_error_record | 4 | session, type | ~1MB |
| collaboration_event | 4 | session, flow | ~2MB |
| preview_data | 2 | decision_id | ~500KB |
| agent_persona | 1 | agent_type | <10KB |
| user_interaction_metric_event | 4 | type_time, session | ~10MB |

**总计**: ~21.6MB (索引) + 数据本身

---

## 数据库迁移策略

### 初始化脚本

```sql
-- 001_create_build_session.sql
CREATE TABLE build_session (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'success', 'failed', 'partial_success')),
  agent_list JSONB NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP,
  storage_path VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_build_session_user_time ON build_session(user_id, start_time DESC);
CREATE INDEX idx_build_session_project ON build_session(project_id);
CREATE INDEX idx_build_session_archived ON build_session(archived, start_time DESC);
CREATE INDEX idx_build_session_status ON build_session(status);

-- 002_create_agent_work_status.sql
CREATE TABLE agent_work_status (
  status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'retrying', 'skipped')),
  task_description VARCHAR(500),
  progress_percentage SMALLINT NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  retry_count SMALLINT NOT NULL DEFAULT 0,
  max_retry SMALLINT NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_status_session ON agent_work_status(session_id, agent_type);
CREATE INDEX idx_agent_status_agent_id ON agent_work_status(agent_id);
CREATE INDEX idx_agent_status_status ON agent_work_status(status);
CREATE INDEX idx_agent_status_updated ON agent_work_status(updated_at DESC);

-- 003_create_decision_record.sql
CREATE TABLE decision_record (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  reasoning JSONB NOT NULL,
  alternatives JSONB,
  tradeoffs TEXT,
  importance VARCHAR(10) NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decision_session ON decision_record(session_id, timestamp DESC);
CREATE INDEX idx_decision_agent ON decision_record(agent_id);
CREATE INDEX idx_decision_importance ON decision_record(importance, is_read);
CREATE INDEX idx_decision_unread ON decision_record(session_id, is_read) WHERE is_read = FALSE;

-- 004_create_agent_error_record.sql
CREATE TABLE agent_error_record (
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL,
  error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('minor', 'critical')),
  error_category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  technical_details TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  retry_attempts SMALLINT NOT NULL DEFAULT 0,
  resolution VARCHAR(50) CHECK (resolution IN ('auto_retry_success', 'user_retry', 'user_skip', 'user_abort', 'pending')),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_session ON agent_error_record(session_id, timestamp DESC);
CREATE INDEX idx_error_agent ON agent_error_record(agent_id);
CREATE INDEX idx_error_type ON agent_error_record(error_type, error_category);
CREATE INDEX idx_error_unresolved ON agent_error_record(resolution) WHERE resolution = 'pending';

-- 005_create_collaboration_event.sql
CREATE TABLE collaboration_event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_session(session_id) ON DELETE CASCADE,
  source_agent_id VARCHAR(100) NOT NULL,
  source_agent_type VARCHAR(50) NOT NULL,
  target_agent_id VARCHAR(100) NOT NULL,
  target_agent_type VARCHAR(50) NOT NULL,
  data_summary TEXT NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collab_session ON collaboration_event(session_id, timestamp);
CREATE INDEX idx_collab_source ON collaboration_event(source_agent_id);
CREATE INDEX idx_collab_target ON collaboration_event(target_agent_id);
CREATE INDEX idx_collab_flow ON collaboration_event(source_agent_type, target_agent_type);

-- 006_create_preview_data.sql
CREATE TABLE preview_data (
  preview_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decision_record(decision_id) ON DELETE CASCADE,
  preview_type VARCHAR(50) NOT NULL CHECK (preview_type IN ('image', 'html', 'json', 'diagram')),
  preview_content TEXT NOT NULL,
  title VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_preview_decision ON preview_data(decision_id);
CREATE INDEX idx_preview_type ON preview_data(preview_type);

-- 007_create_agent_persona.sql
CREATE TABLE agent_persona (
  agent_type VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NOT NULL,
  status_template VARCHAR(200) NOT NULL,
  color_theme VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'low')),
  personality_tone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 插入预定义配置
INSERT INTO agent_persona (agent_type, display_name, avatar_url, status_template, color_theme, priority, personality_tone) VALUES
  ('UIAgent', 'UI设计师', '/avatars/ui-agent.png', '{agent_name}正在{task_description}...', '#3B82F6', 'high', 'professional_friendly'),
  ('BackendAgent', '后端开发师', '/avatars/backend-agent.png', '{agent_name}正在{task_description}...', '#10B981', 'high', 'professional_friendly'),
  ('DatabaseAgent', '数据架构师', '/avatars/database-agent.png', '{agent_name}正在{task_description}...', '#8B5CF6', 'high', 'professional_friendly'),
  ('IntegrationAgent', '集成专家', '/avatars/integration-agent.png', '{agent_name}正在{task_description}...', '#F59E0B', 'low', 'professional_friendly'),
  ('DeploymentAgent', '部署工程师', '/avatars/deployment-agent.png', '{agent_name}正在{task_description}...', '#EF4444', 'low', 'professional_friendly');

-- 008_create_user_interaction_metric_event.sql
CREATE TABLE user_interaction_metric_event (
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

CREATE INDEX idx_metric_type_time ON user_interaction_metric_event(event_type, timestamp DESC);
CREATE INDEX idx_metric_session ON user_interaction_metric_event(anonymous_session_id);
CREATE INDEX idx_metric_opted_in ON user_interaction_metric_event(opted_in);
CREATE INDEX idx_metric_timestamp ON user_interaction_metric_event(timestamp DESC);

-- 009_create_archiving_function.sql
-- 后台归档任务 (可通过PostgreSQL定时任务或外部cron调度)
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS void AS $$
BEGIN
  -- 标记需要归档的会话 (具体导出逻辑在应用层实现)
  UPDATE build_session
  SET archived = TRUE, archived_at = NOW()
  WHERE start_time < (NOW() - INTERVAL '30 days')
    AND archived = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 010_create_metric_cleanup_function.sql
-- 清理过期指标数据 (保留12个月)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM user_interaction_metric_event
  WHERE timestamp < (NOW() - INTERVAL '12 months');
END;
$$ LANGUAGE plpgsql;
```

### 迁移执行顺序

1. `001_create_build_session.sql` (主表)
2. `002_create_agent_work_status.sql` (依赖 build_session)
3. `003_create_decision_record.sql` (依赖 build_session)
4. `004_create_agent_error_record.sql` (依赖 build_session)
5. `005_create_collaboration_event.sql` (依赖 build_session)
6. `006_create_preview_data.sql` (依赖 decision_record)
7. `007_create_agent_persona.sql` (独立配置表)
8. `008_create_user_interaction_metric_event.sql` (独立指标表)
9. `009_create_archiving_function.sql` (归档函数)
10. `010_create_metric_cleanup_function.sql` (清理函数)

### 版本控制

使用数据库迁移工具 (如 `node-pg-migrate`, `Flyway`, `Liquibase`):

```bash
# 创建新迁移
npm run migrate:create add_new_field

# 执行迁移
npm run migrate:up

# 回滚迁移
npm run migrate:down
```

---

## 数据一致性保障

### 外键约束

- `agent_work_status.session_id` → `build_session.session_id` (ON DELETE CASCADE)
- `decision_record.session_id` → `build_session.session_id` (ON DELETE CASCADE)
- `agent_error_record.session_id` → `build_session.session_id` (ON DELETE CASCADE)
- `collaboration_event.session_id` → `build_session.session_id` (ON DELETE CASCADE)
- `preview_data.decision_id` → `decision_record.decision_id` (ON DELETE CASCADE)

### 事务边界

**写入操作**:
- Agent状态更新: 单事务
- 决策记录 + 预览数据: 同一事务
- 错误记录 + Agent状态更新: 同一事务

**归档操作**:
- 导出JSON + 上传S3 + 更新archived标志: 跨系统事务 (需要补偿机制)

---

## 性能优化建议

### 查询优化

1. **分页查询**: 所有列表查询必须使用 `LIMIT` 和 `OFFSET`
2. **选择性索引**: 对高频过滤条件创建部分索引 (如 `WHERE is_read = FALSE`)
3. **JSONB字段**: 对 `context` 字段创建GIN索引支持快速查询

```sql
-- 示例: 为 context 字段创建GIN索引
CREATE INDEX idx_metric_context_gin ON user_interaction_metric_event USING GIN (context);

-- 查询示例: 查找特定Agent类型的交互
SELECT * FROM user_interaction_metric_event
WHERE context @> '{"agent_type": "UIAgent"}';
```

### 数据库连接池

```typescript
// backend/src/services/DatabaseService.ts
import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 缓存策略

**Redis缓存热数据**:
- Agent Persona配置 (TTL: 1小时)
- 活跃会话状态 (TTL: 5分钟)
- 未读决策计数 (TTL: 30秒)

```typescript
// 示例: 缓存Agent Persona
const cacheKey = `agent_persona:${agentType}`;
let persona = await redis.get(cacheKey);
if (!persona) {
  persona = await db.query('SELECT * FROM agent_persona WHERE agent_type = $1', [agentType]);
  await redis.setex(cacheKey, 3600, JSON.stringify(persona));
}
```

---

## 总结

本数据模型设计涵盖了"AI思考过程可视化系统"的8个核心实体，完整支持以下功能需求:

✅ **实时可视化**: AgentWorkStatus + WebSocket推送
✅ **决策透明化**: DecisionRecord + PreviewData
✅ **错误恢复**: AgentErrorRecord + 智能重试策略
✅ **协作流程**: CollaborationEvent + 双视图展示
✅ **拟人化交互**: AgentPersona + 性格语气配置
✅ **数据生命周期**: 热数据(30天) + 冷数据归档(S3)
✅ **产品分析**: UserInteractionMetricEvent + 隐私保护
✅ **性能优化**: 多层索引 + 查询优化 + Redis缓存

**关键设计亮点**:
1. **聚合根模式**: BuildSession作为核心聚合根，管理所有子实体生命周期
2. **状态机清晰**: Agent状态和错误恢复流程有明确的状态转换规则
3. **查询优化**: 针对高频查询路径设计专用索引和部分索引
4. **数据分层**: 热数据快速访问，冷数据按需加载，平衡成本和体验
5. **隐私优先**: 匿名化数据收集，用户可控opt-out，遵守GDPR/CCPA

**下一步行动**:
- 执行数据库迁移脚本初始化表结构
- 实现后端API层的CRUD操作
- 开发归档后台任务 (定时任务 + S3集成)
- 集成Redis缓存层优化查询性能
