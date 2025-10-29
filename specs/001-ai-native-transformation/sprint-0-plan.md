# Sprint 0 规划：环境准备与基础设施
## AI原生平台核心转型

**Sprint**: Sprint 0 (Foundation Sprint)
**时间**: 2025-10-29 ~ 2025-11-05 (1周)
**目标**: 完成开发环境搭建和基础设施层，为MVP实施做好准备
**团队**: 1-2名全栈开发者

---

## 🎯 Sprint目标

### 主要目标
1. ✅ 搭建完整的开发环境（前端+后端+数据库）
2. ✅ 实现基础数据模型和WebSocket基础设施
3. ✅ 完成Agent基础架构扩展
4. ✅ 验证技术栈可行性

### 成功标准
- [ ] 开发服务器正常启动（前端:12000, 后端:3001）
- [ ] 数据库包含10个表且迁移成功
- [ ] WebSocket连接建立并通过心跳测试
- [ ] BaseAgent可以发布状态到Redis
- [ ] AgentOrchestrator可以创建和调度基础任务

---

## 📋 Sprint Backlog

### Phase 1: Setup & Environment (T001-T007)
**预计时间**: 1天
**优先级**: P0（阻塞后续所有工作）

#### 任务清单

**T001: 安装新依赖包** [2小时]
- 前端依赖: `antd`, `zustand`, `@tanstack/react-query`, `socket.io-client`, `reactflow`
- 后端依赖: `prisma`, `@prisma/client`, `socket.io`, `ioredis`
- 验证: `npm list` 显示所有包已安装

**T002 [P]: 配置Ant Design主题** [1小时]
- 文件: `frontend/src/theme/index.ts`
- 配置深色/浅色主题切换
- 自定义主题色（主色：#1890ff）
- 验证: 运行前端开发服务器，主题生效

**T003 [P]: 配置Zustand状态管理** [1小时]
- 文件: `frontend/src/stores/index.ts`
- 创建store基础结构
- 配置DevTools（开发环境）
- 验证: 可以在浏览器DevTools查看store

**T004: 使用Prisma创建数据库Schema** [3小时]
- 文件: `backend/prisma/schema.prisma`
- 定义10个数据模型（参考data-model.md）:
  - User, Project, Agent, Task, BuildLog
  - Version, Component, DataModel, APIEndpoint, Deployment
- 配置关系和索引
- 验证: `npx prisma validate` 通过

**T005: 运行Prisma迁移** [1小时]
- 命令: `npx prisma migrate dev --name init`
- 验证所有10个表创建成功
- 生成Prisma Client
- 验证: `psql` 查询显示所有表存在

**T006 [P]: 配置Redis连接池** [1小时]
- 文件: `backend/src/config/redis.ts`
- 配置连接参数（从环境变量读取）
- 实现连接测试函数
- 验证: 连接测试通过

**T007 [P]: 配置AI Service多提供者切换** [2小时]
- 文件: `backend/src/services/AIService.ts`
- 实现Anthropic和OpenAI双提供者支持
- 从环境变量读取配置
- 实现fallback机制
- 验证: 测试两个提供者都可用

**Phase 1 完成标准**:
```bash
✅ npm install 成功
✅ npm run dev 前端和后端都启动
✅ 数据库包含10个表
✅ Redis连接成功
✅ AI Service测试通过
```

---

### Phase 2: Foundational Infrastructure (T008-T022)
**预计时间**: 2-3天
**优先级**: P1（MVP依赖）

#### 2.1 数据模型 (T008-T012.1) [1天]

**T008 [P]: 创建User模型**
- 文件: `backend/src/models/User.ts`
- 实现CRUD方法
- 实现密码哈希
- 单元测试

**T009 [P]: 创建Project模型**
- 文件: `backend/src/models/Project.ts`
- 实现CRUD方法
- 实现用户关联查询
- 单元测试

**T010 [P]: 创建Agent模型**
- 文件: `backend/src/models/Agent.ts`
- 实现状态管理方法
- 实现能力查询
- 单元测试

**T011 [P]: 创建Task模型**
- 文件: `backend/src/models/Task.ts`
- 实现任务状态转换
- 实现依赖关系查询
- 单元测试

**T012 [P]: 创建BuildLog模型**
- 文件: `backend/src/models/BuildLog.ts`
- 实现日志写入（批量）
- 实现日志查询（分页、过滤）
- 单元测试

**T012.1 [P]: 创建Version模型**
- 文件: `backend/src/models/Version.ts`
- 实现快照保存
- 实现版本比较
- 单元测试

**并行机会**: T008-T012.1可由2名开发者并行开发

---

#### 2.2 WebSocket基础设施 (T013-T016) [半天]

**T013: 实现WebSocket服务器初始化**
- 文件: `backend/src/index.ts`
- 集成Socket.IO
- 配置CORS
- 实现基础错误处理
- 验证: 前端可以连接

**T014: 实现WebSocket认证中间件**
- 文件: `backend/src/websocket/middleware/auth.ts`
- 验证JWT token
- 拒绝未授权连接
- 验证: 未授权连接被拒绝

**T015: 实现项目房间管理**
- 文件: `backend/src/websocket/handlers/roomHandler.ts`
- 实现join/leave房间逻辑
- 实现房间成员管理
- 验证: 用户可以加入项目房间

**T016: 实现心跳机制**
- 文件: `backend/src/websocket/handlers/heartbeatHandler.ts`
- 客户端每30秒发送ping
- 服务器响应pong
- 超时断开连接
- 验证: 心跳正常工作

---

#### 2.3 Agent基础架构 (T017-T019) [1天]

**T017: 扩展BaseAgent抽象类**
- 文件: `backend/src/agents/BaseAgent.ts`
- 添加`publishStatus()`方法
- 实现状态变更事件发布到Redis
- 添加任务槽位管理（并发限制≤3）
- 单元测试

**T018: 实现AgentOrchestrator核心调度逻辑**
- 文件: `backend/src/services/AgentOrchestrator.ts`
- 实现DAG任务依赖图构建
- 实现优先级队列调度
- **强制执行Agent并发限制（≤3任务）**
- 实现任务分配算法
- 单元测试和集成测试

**T019: 实现TaskQueue服务**
- 文件: `backend/src/services/TaskQueueService.ts`
- 使用Redis实现持久化队列
- 实现入队/出队操作
- 实现任务状态查询
- 验证: 任务可以持久化并恢复

---

#### 2.4 前端基础组件 (T020-T022) [半天]

**T020 [P]: 创建WebSocket Hook**
- 文件: `frontend/src/hooks/useWebSocket.ts`
- 封装Socket.IO连接逻辑
- 实现自动重连
- 实现事件订阅/取消
- 提供连接状态

**T021 [P]: 创建Project状态Store**
- 文件: `frontend/src/stores/projectStore.ts`
- 管理当前项目状态
- 管理项目列表
- 实现乐观更新

**T022 [P]: 创建Agent状态Store**
- 文件: `frontend/src/stores/agentStore.ts`
- 管理所有Agent状态
- 订阅WebSocket更新
- 实现状态动画触发

**并行机会**: T020-T022可与后端任务并行

**Phase 2 完成标准**:
```bash
✅ 所有数据模型通过单元测试
✅ WebSocket服务器启动并接受连接
✅ AgentOrchestrator可以创建和调度任务
✅ 前端可以连接WebSocket并订阅事件
✅ Agent状态可以发布到Redis并推送到前端
```

---

## 📅 每日计划

### Day 1 (2025-10-29): 环境搭建
- **上午**: T001-T003（依赖安装、前端配置）
- **下午**: T004-T005（数据库Schema和迁移）
- **晚上**: T006-T007（Redis和AI Service配置）
- **验收**: 开发环境完整可用

### Day 2 (2025-10-30): 数据模型
- **上午**: T008-T009（User和Project模型）
- **下午**: T010-T011（Agent和Task模型）
- **晚上**: T012-T012.1（BuildLog和Version模型）
- **验收**: 所有模型测试通过

### Day 3 (2025-10-31): WebSocket基础设施
- **上午**: T013-T014（WebSocket服务器和认证）
- **下午**: T015-T016（房间管理和心跳）
- **晚上**: 集成测试和调试
- **验收**: WebSocket连接稳定

### Day 4 (2025-11-01): Agent基础架构
- **全天**: T017-T019（BaseAgent、AgentOrchestrator、TaskQueue）
- **重点**: 并发控制和任务调度
- **验收**: Agent可以调度和执行任务

### Day 5 (2025-11-02): 前端基础组件
- **上午**: T020（WebSocket Hook）
- **下午**: T021-T022（Store实现）
- **晚上**: 前后端集成测试
- **验收**: 前端可以实时接收Agent状态

### Day 6-7 (2025-11-03~04): 测试和优化
- 端到端测试
- 性能测试
- 文档更新
- Sprint回顾准备

---

## 🔄 并行执行策略

### 双人团队分工

**开发者A（后端为主）**:
- Day 1: T001, T004-T007
- Day 2: T008, T010, T012
- Day 3: T013-T016
- Day 4: T017-T019

**开发者B（前端为主）**:
- Day 1: T001-T003（协助）
- Day 2: T009, T011, T012.1
- Day 3: T020-T022（提前开始）
- Day 4: 前端集成和UI准备
- Day 5: 前后端联调

### 单人团队执行顺序
严格按照T001→T022顺序执行，预计需要5-6个工作日。

---

## 🧪 测试策略

### 单元测试
- 每个Model必须有测试覆盖率>80%
- 每个Service必须有Mock测试
- 使用Jest测试框架

### 集成测试
- WebSocket连接和断开测试
- Agent状态发布和订阅测试
- 任务调度和执行测试

### 验收测试清单
```bash
# 环境验证
[ ] npm run dev 启动成功
[ ] 前端访问 localhost:12000 正常
[ ] 后端访问 localhost:3001/health 返回200

# 数据库验证
[ ] psql -c "\dt" 显示10个表
[ ] Prisma Studio 可以打开

# WebSocket验证
[ ] 前端可以连接WebSocket
[ ] 心跳机制正常（30秒间隔）
[ ] 断线后自动重连

# Agent验证
[ ] BaseAgent可以发布状态到Redis
[ ] AgentOrchestrator可以创建任务
[ ] 任务可以分配给Agent
[ ] Agent并发限制生效（≤3任务）

# 前端验证
[ ] useWebSocket Hook正常工作
[ ] Store可以接收和存储数据
[ ] DevTools显示store状态
```

---

## 📊 风险和缓解措施

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| Prisma迁移失败 | 中 | 高 | 提前备份数据库，测试迁移脚本 |
| WebSocket连接不稳定 | 中 | 高 | 实现重连机制，测试弱网环境 |
| Redis连接问题 | 低 | 中 | 使用Docker容器，配置健康检查 |
| AI API配额不足 | 中 | 中 | 实现缓存，准备降级方案 |
| 并发控制bug | 中 | 高 | 编写压力测试，验证并发限制 |

---

## 📈 进度跟踪

### 每日站会（Daily Standup）
- **时间**: 每天上午10:00
- **时长**: 15分钟
- **内容**:
  - 昨天完成了什么？
  - 今天计划做什么？
  - 遇到什么阻碍？

### 进度报告模板
```markdown
## Sprint 0 进度 - Day X

**日期**: YYYY-MM-DD
**完成任务**: T001, T002, T003
**进行中**: T004
**阻塞**: 无

**完成率**: X/22 (X%)
**健康度**: 🟢 健康 / 🟡 风险 / 🔴 延期

**明天计划**: T005-T007
```

---

## 🎉 Sprint验收标准

### Definition of Done (DoD)

每个任务必须满足：
- [ ] 代码已编写并通过Lint检查
- [ ] 单元测试已编写并通过
- [ ] 代码已提交到git
- [ ] 相关文档已更新

Sprint 0整体完成标准：
- [ ] 所有22个任务标记为完成
- [ ] 所有验收测试通过
- [ ] 技术债务记录到backlog
- [ ] Sprint回顾会议完成
- [ ] 演示环境可用（Demo给Product Owner）

### 演示内容

Sprint 0演示重点：
1. ✅ 展示开发环境（前端+后端同时运行）
2. ✅ 展示数据库Schema（Prisma Studio）
3. ✅ 展示WebSocket连接（浏览器DevTools Network标签）
4. ✅ 展示Agent状态发布（模拟Agent工作，前端实时显示状态）
5. ✅ 展示任务调度（AgentOrchestrator分配任务给Agent）

---

## 📚 参考文档

- [tasks.md](./tasks.md) - 完整任务清单
- [data-model.md](./data-model.md) - 数据模型设计
- [plan.md](./plan.md) - 技术实施计划
- [research.md](./research.md) - 技术决策
- [quickstart.md](./quickstart.md) - 开发快速启动

---

## 🔜 下一个Sprint

**Sprint 1: MVP实施 - User Story 1 + 2**
- 时间: 2025-11-05 ~ 2025-11-19 (2周)
- 目标: 实现自然语言应用创建和Agent协作可视化
- 任务: T023-T051（Phase 3-4）

---

**创建日期**: 2025-10-29
**最后更新**: 2025-10-29
**状态**: 📋 规划完成，准备执行
**批准**: 待Product Owner批准

---

## ✅ Sprint启动检查清单

在开始执行前，确认：
- [ ] 团队成员已阅读本规划
- [ ] 开发环境要求已确认（Node.js 18+, PostgreSQL, Redis）
- [ ] Git分支已创建（001-ai-native-transformation）
- [ ] 环境变量模板已准备（.env.example）
- [ ] 所有团队成员有仓库访问权限
- [ ] 每日站会时间已确定
- [ ] Sprint验收会议已预约（2025-11-05）

**准备就绪，开始Sprint 0！** 🚀
