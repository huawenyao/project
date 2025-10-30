# Tasks: AI思考过程可视化系统

**Input**: Design documents from `/specs/002-ai-thinking-visualization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create visualization feature directory structure in backend/src/ and frontend/src/
- [X] T002 [P] Install backend dependencies: socket.io, aws-sdk, node-cron, sequelize for backend/package.json
- [X] T003 [P] Install frontend dependencies: zustand, @tanstack/react-query, reactflow, react-hot-toast, @tanstack/react-virtual for frontend/package.json
- [X] T004 [P] Configure TypeScript types for visualization features in backend/src/types/visualization.types.ts
- [X] T005 [P] Configure TypeScript types for visualization features in frontend/src/types/visualization.types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Data Layer

- [X] T006 Run migration 001_create_build_sessions.sql to create build_session table with indexes
- [X] T007 Run migration 002_create_agent_work_status.sql to create agent_work_status table with indexes
- [X] T008 Run migration 003_create_decision_records.sql to create decision_record table with indexes
- [X] T009 Run migration 004_create_agent_error_records.sql to create agent_error_record table with indexes
- [X] T010 Run migration 005_create_collaboration_events.sql to create collaboration_event table with indexes
- [X] T011 Run migration 006_create_preview_data.sql to create preview_data table with indexes
- [X] T012 Run migration 007_create_agent_personas.sql to create agent_persona table and seed data
- [X] T013 Run migration 008_create_user_interaction_metrics.sql to create user_interaction_metric_event table with indexes
- [X] T014 Run migration 009_create_indexes.sql to create additional optimized indexes
- [X] T015 Run migration 010_seed_agent_personas.sql to insert 5 agent persona configurations

### Backend Models (Sequelize ORM)

- [X] T016 [P] Create BuildSession model in backend/src/models/BuildSession.model.ts
- [X] T017 [P] Create AgentWorkStatus model in backend/src/models/AgentWorkStatus.model.ts
- [X] T018 [P] Create DecisionRecord model in backend/src/models/DecisionRecord.model.ts
- [X] T019 [P] Create AgentErrorRecord model in backend/src/models/AgentErrorRecord.model.ts
- [X] T020 [P] Create CollaborationEvent model in backend/src/models/CollaborationEvent.model.ts
- [X] T021 [P] Create PreviewData model in backend/src/models/PreviewData.model.ts
- [X] T022 [P] Create AgentPersona model in backend/src/models/AgentPersona.model.ts
- [X] T023 [P] Create UserInteractionMetric model in backend/src/models/UserInteractionMetric.model.ts

### Backend Core Services

- [X] T024 Create VisualizationService base service in backend/src/services/VisualizationService.ts
- [X] T025 Create WebSocketService with Socket.IO integration in backend/src/services/WebSocketService.ts
- [X] T026 [P] Create AgentStatusService in backend/src/services/AgentStatusService.ts
- [X] T027 [P] Create DecisionService in backend/src/services/DecisionService.ts
- [X] T028 Create DataArchiveService with S3 integration in backend/src/services/DataArchiveService.ts
- [X] T029 [P] Create MetricsCollector service for anonymized data in backend/src/services/MetricsCollector.ts
- [X] T030 [P] Create ReplayService for historical session playback in backend/src/services/ReplayService.ts

### WebSocket Infrastructure

- [X] T031 Implement WebSocket authentication middleware in backend/src/websocket/middleware/authentication.ts
- [X] T032 [P] Implement WebSocket rate limiting middleware in backend/src/websocket/middleware/rateLimit.ts
- [X] T033 Create visualization handler in backend/src/websocket/handlers/visualizationHandler.ts
- [X] T034 [P] Create visualizationEmitter with mixed-frequency strategy in backend/src/websocket/visualizationEmitter.ts
- [X] T035 [P] Create visualizationScheduler with priority-based routing in backend/src/jobs/visualizationScheduler.ts
- [X] T036 [P] Create API routes in backend/src/routes/visualizationRoutes.ts

### Frontend State Management

- [X] T037 [P] Create Zustand visualizationStore in frontend/src/stores/visualizationStore.ts
- [X] T038 [P] Create Zustand agentStatusStore in frontend/src/stores/agentStatusStore.ts
- [X] T039 [P] Create Zustand decisionStore in frontend/src/stores/decisionStore.ts
- [X] T040 [P] Create Zustand themeStore with warm/tech themes in frontend/src/stores/themeStore.ts
- [X] T041 [P] Create Zustand settingsStore in frontend/src/stores/settingsStore.ts

### Frontend Services & Hooks

- [X] T042 Create WebSocket client service in frontend/src/services/WebSocketService.ts
- [X] T043 [P] Create VisualizationAPI REST client in frontend/src/services/VisualizationAPI.ts
- [X] T044 [P] Create MetricsService for anonymized tracking in frontend/src/services/MetricsService.ts
- [X] T045 Create useWebSocket hook with reconnection logic in frontend/src/hooks/useWebSocket.ts
- [X] T046 [P] Create useVisualization hook in frontend/src/hooks/useVisualization.ts
- [X] T047 [P] Create useAgentStatus hook with React Query in frontend/src/hooks/useAgentStatus.ts
- [X] T048 [P] Create useDecisions hook with React Query in frontend/src/hooks/useDecisions.ts
- [X] T049 [P] Create useReplay hook in frontend/src/hooks/useReplay.ts
- [X] T050 [P] Create useTheme hook in frontend/src/hooks/useTheme.ts

### Theme System

- [X] T051 [P] Create warm-friendly theme CSS in frontend/src/styles/themes/warm-friendly.css
- [X] T052 [P] Create tech-futuristic theme CSS in frontend/src/styles/themes/tech-futuristic.css
- [X] T053 [P] Create animation effects CSS in frontend/src/styles/animations.css
- [X] T054 Configure Tailwind CSS Variables in tailwind.config.js for both themes

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent工作状态和进度 (Priority: P1) 🎯 MVP

**Goal**: 让用户实时看到每个Agent当前正在做什么、完成了多少进度，了解系统正在运行且没有卡住

**Independent Test**: 当用户发起一个应用构建请求后，在界面上能看到每个Agent(如UIAgent、BackendAgent)的当前任务描述和完成百分比，并能看到进度条实时更新。测试完成标志:从0%到100%的进度变化能准确反映实际任务完成情况。

### Backend Implementation for US1

- [X] T055 [P] [US1] Implement POST /api/visualization/sessions endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T056 [P] [US1] Implement GET /api/visualization/sessions endpoint with hot/cold filter in backend/src/routes/visualizationRoutes.ts
- [X] T057 [P] [US1] Implement GET /api/visualization/sessions/:id endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T058 [US1] Add agent status update logic to AgentStatusTracker service in backend/src/services/AgentStatusTracker.ts
- [X] T059 [US1] Implement mixed-frequency WebSocket push in agentStatusEmitter (200-500ms for high-priority, 1-2s for low-priority) in backend/src/websocket/handlers/agentStatusEmitter.ts
- [X] T060 [US1] Add session state management to VisualizationService in backend/src/services/VisualizationService.ts
- [X] T061 [US1] Integrate WebSocket events with AgentOrchestrator in backend/src/services/AgentOrchestrator.ts

### Frontend Implementation for US1

- [X] T062 [P] [US1] Create VisualizationPanel container component in frontend/src/components/Visualization/VisualizationPanel.tsx
- [X] T063 [P] [US1] Create AgentStatusCard component with progress bar in frontend/src/components/Visualization/AgentStatusCard.tsx
- [X] T064 [P] [US1] Create ProgressSummary component for overall progress in frontend/src/components/Visualization/ProgressSummary.tsx
- [X] T065 [P] [US1] Create AgentListView component (default view) in frontend/src/components/Visualization/AgentListView.tsx
- [X] T066 [US1] Integrate WebSocket real-time updates in VisualizationPanel using useAgentStatus hook
- [X] T067 [US1] Add agent status state machine rendering (pending/in_progress/completed/failed/retrying/skipped)
- [X] T068 [US1] Implement throttled updates (500ms) to prevent UI stuttering in frontend/src/hooks/useAgentStatus.ts

### UI Components for US1

- [X] T069 [P] [US1] Create ProgressBar UI component in frontend/src/components/UI/ProgressBar.tsx
- [X] T070 [P] [US1] Create StatusBadge UI component with color-coded states in frontend/src/components/UI/StatusBadge.tsx
- [X] T071 [P] [US1] Create LoadingSpinner UI component in frontend/src/components/UI/LoadingSpinner.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can see real-time agent status and progress updates

---

## Phase 4: User Story 2 - Agent决策推理过程 (Priority: P2)

**Goal**: 让用户看到AI Agent为什么做出某个决策，例如为什么选择了某个UI组件、为什么采用某种数据库结构，理解AI的思考逻辑并建立信任

**Independent Test**: 在Agent工作过程中，当Agent做出关键决策时(如选择React作为前端框架)，系统弹出一张决策卡片，展示决策内容、理由、考虑的备选方案、以及对项目的影响。用户可以点击查看详情或关闭卡片继续观察。

### Backend Implementation for US2

- [X] T072 [P] [US2] Implement GET /api/visualization/decisions endpoint with importance filter in backend/src/routes/visualizationRoutes.ts
- [X] T073 [P] [US2] Implement POST /api/visualization/decisions/:id/mark-read endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T074 [US2] Add decision recording logic to DecisionManager service in backend/src/services/DecisionManager.ts
- [X] T075 [US2] Implement decision importance classification (high/medium/low) in DecisionManager
- [X] T076 [US2] Implement decision notification routing in decisionEmitter (toast for high, sidebar for medium/low) in backend/src/websocket/handlers/decisionEmitter.ts
- [X] T077 [US2] Add decision-created WebSocket event with <100ms latency for high-importance decisions

### Frontend Implementation for US2

- [X] T078 [P] [US2] Create DecisionToast component with react-hot-toast in frontend/src/components/Visualization/DecisionToast.tsx
- [X] T079 [P] [US2] Create DecisionSidebar component with timeline view in frontend/src/components/Visualization/DecisionSidebar.tsx
- [X] T080 [P] [US2] Create DecisionCard component with full details in frontend/src/components/Visualization/DecisionCard.tsx
- [X] T081 [P] [US2] Create DecisionTimeline component with unread badges in frontend/src/components/Visualization/DecisionTimeline.tsx
- [X] T082 [US2] Integrate decision WebSocket events in decisionStore
- [X] T083 [US2] Implement toast auto-dismiss after 5 seconds with sidebar persistence
- [X] T084 [US2] Add decision detail expansion modal with reasoning/alternatives/tradeoffs
- [X] T085 [US2] Implement "mark all as read" functionality in DecisionSidebar
- [X] T086 [US2] Add notification badge with unread count in DecisionSidebar

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - 实时影响预测和预览 (Priority: P2)

**Goal**: 让用户在Agent做出决策前或决策后，能够看到该决策对最终应用的影响预测或预览效果，例如选择某个UI组件后立即看到界面预览

**Independent Test**: 当UIAgent选择了某个UI组件或布局方案时，在决策卡片旁边或下方显示一个小型预览窗口，展示该组件在应用中的样子(可以是静态截图或简单的交互预览)。用户可以放大预览或关闭预览。

### Backend Implementation for US4

- [X] T087 [P] [US4] Add preview data association to decision records in DecisionManager service
- [X] T088 [US4] Implement preview generation for UI decisions (static images) in backend/src/services/DecisionManager.ts
- [X] T089 [P] [US4] Implement preview generation for API decisions (JSON examples) in backend/src/services/DecisionManager.ts
- [X] T090 [US4] Add preview data to decision-created WebSocket events

### Frontend Implementation for US4

- [X] T091 [P] [US4] Create PreviewModal component with image/HTML/JSON rendering in frontend/src/components/Visualization/PreviewModal.tsx
- [X] T092 [US4] Integrate preview display in DecisionCard component
- [X] T093 [US4] Add preview click-to-expand functionality in DecisionCard
- [X] T094 [US4] Implement preview type detection (image/html/json/diagram) and appropriate rendering

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently

---

## Phase 6: User Story 3 - Agent拟人化交互体验 (Priority: P3)

**Goal**: 让Agent像真实团队成员一样协作，带有个性化头像、状态消息(如"正在思考中..."、"已完成任务!")和简单的动画效果，让产品使用体验更生动有趣

**Independent Test**: 在Agent工作过程中，每个Agent显示为一个拟人化卡片，包含: 头像图标、Agent名称、当前状态文本(如"UIAgent正在选择组件库...")、简单的脉动或移动动画(工作时)。用户能感受到Agent像团队成员一样在"活跃工作"。

### Backend Implementation for US3

- [X] T095 [P] [US3] Implement GET /api/visualization/agents/personas endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T096 [US3] Add persona data to agent status updates in AgentStatusTracker
- [X] T097 [US3] Implement professional-friendly message templates in AgentPersona model

### Frontend Implementation for US3

- [X] T098 [US3] Enhance AgentStatusCard with avatar, display name, and color theme from persona
- [X] T099 [US3] Add pulsing animation to in_progress agent cards in frontend/src/styles/animations.css
- [X] T100 [US3] Add celebration animation for completed milestones in frontend/src/styles/animations.css
- [X] T101 [US3] Implement waiting/loading animation for pending agents
- [X] T102 [US3] Add status message templates with task description interpolation
- [X] T103 [US3] Implement professional-friendly tone (checkmark symbols, encouraging phrases) in status messages

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Agent协作过程可视化 (Priority: P3)

**Goal**: 让用户看到不同Agent之间如何协作和传递信息，例如DatabaseAgent完成schema设计后将结果传递给BackendAgent，理解整个系统的工作流程和依赖关系

**Independent Test**: 在可视化面板中，不同Agent卡片之间显示连线或数据流动画，当一个Agent完成任务并输出结果时，连线亮起并显示数据流向下一个Agent。用户可以点击连线查看传递的数据内容摘要。

**Note**: 核心协作事件记录和 WebSocket 推送功能已在 Phase 2 Foundation 中实现（CollaborationService, collaborationEmitter）。Phase 7 主要是前端可视化增强。

### Backend Implementation for US5

- [X] T104 [US5] Add collaboration event recording to AgentOrchestrator (已在 Phase 2 实现)
- [X] T105 [US5] Implement collaboration-event WebSocket push (已在 Phase 2 实现)
- [X] T106 [US5] Add data summary generation for collaboration events (已在 Phase 2 实现)

### Frontend Implementation for US5

- [X] T107 [P] [US5] Create AgentGraphView component (简化版：基于 AgentListView 的流程视图)
- [X] T108 [P] [US5] Create ViewToggle component for list⇌graph switching
- [X] T109 [US5] Implement animated connections with data flow (CSS 动画箭头)
- [X] T110 [US5] Add node positioning (自动布局算法，无需 Web Worker)
- [X] T111 [US5] Enhance AgentListView with simplified arrows and indentation for collaboration flow
- [X] T112 [US5] Add collaboration event detail popup on connection click
- [X] T113 [US5] Implement real-time graph updates when collaboration events arrive via WebSocket

**Checkpoint**: All 5 user stories should now be independently functional

---

## Phase 8: Error Recovery & Resilience

**Purpose**: Implement intelligent error handling and retry mechanisms (FR-015, FR-023)

### Backend Error Handling

- [X] T114 Create error classification logic (minor vs critical) in backend/src/services/ErrorClassifier.ts
- [X] T115 Implement exponential backoff retry for minor errors (1s, 2s, 4s) in AgentOrchestrator
- [X] T116 Add error recording to AgentErrorRecord model in backend/src/services/AgentStatusTracker.ts
- [X] T117 Implement error-occurred WebSocket event with retry state in backend/src/websocket/handlers/errorEmitter.ts

### Frontend Error Handling

- [X] T118 [P] Create ErrorCard component with action buttons (retry/skip/abort) in frontend/src/components/Visualization/ErrorCard.tsx
- [X] T119 Implement error state rendering in AgentStatusCard (red warning, error details)
- [X] T120 Add retry/skip/abort action handlers in VisualizationPanel
- [X] T121 Display retry counter (X/3) in AgentStatusCard during retrying state

---

## Phase 9: Historical Replay & Data Archiving

**Purpose**: Implement 30-day hot data + S3 cold storage strategy (FR-010, FR-018, FR-022)

### Backend Archiving

- [X] T122 Implement daily archive cron job in backend/src/jobs/archiveOldSessions.ts
- [X] T123 Add S3 upload logic with gzip compression in DataArchiveService
- [X] T124 Implement archive metadata tracking in BuildSession model
- [X] T125 Add archive status detection in VisualizationService
- [X] T126 Implement GET /api/visualization/sessions/:id/replay endpoint with S3 loading in backend/src/routes/visualizationRoutes.ts

### Frontend Replay

- [X] T127 [P] Create ReplayPlayer component with playback controls in frontend/src/components/Visualization/ReplayPlayer.tsx
- [X] T128 Implement replay timeline scrubbing in ReplayPlayer
- [X] T129 Add loading indicator for archived session data (3s timeout notice)
- [X] T130 Implement session history list with hot/cold data indicators

---

## Phase 10: Theme System & Preferences

**Purpose**: Implement dual-theme system and user preferences (FR-021, FR-014)

### Frontend Theme Implementation

- [X] T131 [P] Create ThemeToggle component in frontend/src/components/Visualization/ThemeToggle.tsx
- [X] T132 [P] Create FocusModeToggle component in frontend/src/components/Visualization/FocusModeToggle.tsx
- [X] T133 Implement theme persistence to localStorage in themeStore
- [X] T134 Add theme-specific animations and transitions in frontend/src/styles/animations.css
- [X] T135 Implement focus mode (hide low-priority agents and decisions) in VisualizationPanel

### Backend User Settings

- [X] T136 Implement PUT /api/visualization/settings/theme endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T137 [P] Implement PUT /api/visualization/settings/privacy endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T138 Add user preference persistence to database

---

## Phase 11: Anonymized Metrics Collection

**Purpose**: Implement privacy-first analytics (FR-024, FR-025, FR-026)

### Backend Metrics

- [X] T139 Implement client-side anonymization in MetricsCollector service
- [X] T140 Implement POST /api/visualization/metrics endpoint in backend/src/routes/visualizationRoutes.ts
- [X] T141 Add metrics aggregation logic for 8 core event types
- [X] T142 Implement 12-month data retention cleanup in backend/src/jobs/cleanupOldMetrics.ts
- [X] T143 Add GDPR-compliant data export/deletion endpoints

### Frontend Metrics

- [X] T144 Integrate PostHog client SDK in MetricsService
- [X] T145 Implement Cookie consent banner in frontend/src/components/CookieConsent.tsx
- [X] T146 Add opt-in/opt-out toggle in Settings page
- [X] T147 Implement 8 core metric tracking events (decision click, theme switch, etc.)
- [X] T148 Add PII sanitization before metric submission in MetricsService

---

## Phase 12: Performance Optimization

**Purpose**: Ensure 30fps+ rendering with 10+ concurrent agents (research.md decision #7)

### Backend Performance

- [X] T149 Implement Redis caching for AgentPersona configurations in backend/src/services/AgentStatusTracker.ts
- [X] T150 Add Redis caching for active session states (5 min TTL)
- [X] T151 Implement database connection pooling optimization in backend/src/services/DatabaseService.ts
- [X] T152 Add WebSocket message batching for low-priority updates

### Frontend Performance

- [X] T153 Implement virtual scrolling for decision timeline using @tanstack/react-virtual in DecisionTimeline
- [X] T154 Add React.memo to all visualization components (AgentStatusCard, DecisionCard, etc.)
- [X] T155 Implement throttled WebSocket updates (500ms) in useAgentStatus hook
- [X] T156 Move graph layout calculation to Web Worker in frontend/src/workers/graphLayout.worker.ts
- [X] T157 Add performance monitoring (FPS counter) in frontend/src/utils/performanceMonitor.ts

---

## Phase 13: WebSocket Resilience

**Purpose**: Implement bulletproof WebSocket connection with auto-reconnect (FR-012, research.md decision #5)

### Backend WebSocket

- [X] T158 Implement heartbeat/ping-pong in WebSocketService (30s interval)
- [X] T159 Add connection state broadcast to clients
- [X] T160 Implement state sync on reconnection in sessionSubscription handler

### Frontend WebSocket

- [X] T161 Implement exponential backoff reconnection (1s, 2s, 4s, 8s, 10s max) in WebSocketService
- [X] T162 Add connection status indicator in frontend/src/components/ConnectionIndicator.tsx
- [X] T163 Implement automatic state resync after reconnection in useWebSocket hook
- [X] T164 Add user notification on connection lost/restored using toast

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all user stories

### Documentation & Validation

- [ ] T165 [P] Validate all 52 environment variables in quickstart.md are documented
- [ ] T166 [P] Test all 50+ feature verification checklist items in quickstart.md
- [ ] T167 [P] Update README with visualization feature overview

### Code Quality

- [ ] T168 [P] Run ESLint and fix warnings in backend/src/
- [ ] T169 [P] Run ESLint and fix warnings in frontend/src/
- [ ] T170 [P] TypeScript strict mode validation for all visualization files
- [ ] T171 Code cleanup: remove console.logs, unused imports

### Performance Validation

- [ ] T172 Load test: Verify 1000+ concurrent WebSocket connections
- [ ] T173 UI test: Verify 30fps+ with 10 concurrent agents updating
- [ ] T174 Latency test: Verify agent status update <1s (SC-001)
- [ ] T175 Query test: Verify hot data queries <500ms, cold data <3s (FR-018)

### Security & Compliance

- [ ] T176 Security audit: Ensure all WebSocket endpoints require JWT authentication
- [ ] T177 Privacy audit: Verify no PII in UserInteractionMetricEvent collection
- [ ] T178 GDPR compliance: Test opt-out functionality and data deletion
- [ ] T179 Rate limiting: Verify all endpoints respect limits (100-1000 req/min)

### Responsive Design

- [ ] T180 [P] Test mobile layout for VisualizationPanel (single column)
- [ ] T181 [P] Test tablet layout for decision sidebar (slide-over)
- [ ] T182 Implement responsive breakpoints for AgentListView and AgentGraphView

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US4 → US3 → US5)
- **Cross-Cutting (Phases 8-13)**: Can start after respective user story foundations
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Phase 3**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2) - Phase 4**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P2) - Phase 5**: Depends on US2 (decision cards exist)
- **User Story 3 (P3) - Phase 6**: Depends on US1 (agent status cards exist)
- **User Story 5 (P3) - Phase 7**: Depends on US1 (agent components exist)

### Within Each User Story

- Backend models before services
- Services before routes/WebSocket handlers
- Frontend stores/hooks before components
- Base components before specialized features
- Story core implementation before integration

### Parallel Opportunities

- **Phase 1 (Setup)**: All 5 tasks can run in parallel
- **Phase 2 (Foundational)**:
  - All migrations (T006-T015) can run in parallel after database setup
  - All models (T016-T023) can run in parallel
  - Services can partially parallelize (T026-T030 have no interdependencies)
  - WebSocket handlers (T034-T036) can run in parallel
  - All stores (T037-T041) can run in parallel
  - All hooks (T046-T050) can run in parallel
  - Theme CSS files (T051-T052) can run in parallel
- **Within User Stories**: All tasks marked [P] can run in parallel
- **Cross-Cutting Phases**: Many tasks within phases 8-13 can parallelize

---

## Parallel Example: Phase 2 Foundational

```bash
# After database setup, run all migrations in parallel:
T006: "001_create_build_sessions.sql"
T007: "002_create_agent_work_status.sql"
T008: "003_create_decision_records.sql"
T009: "004_create_agent_error_records.sql"
T010: "005_create_collaboration_events.sql"
T011: "006_create_preview_data.sql"
T012: "007_create_agent_personas.sql"
T013: "008_create_user_interaction_metrics.sql"

# After migrations, create all models in parallel:
T016: "BuildSession model"
T017: "AgentWorkStatus model"
T018: "DecisionRecord model"
T019: "AgentErrorRecord model"
T020: "CollaborationEvent model"
T021: "PreviewData model"
T022: "AgentPersona model"
T023: "UserInteractionMetricEvent model"
```

---

## Parallel Example: User Story 1

```bash
# Backend routes can run in parallel:
T055: "POST /api/visualization/sessions"
T056: "GET /api/visualization/sessions"
T057: "GET /api/visualization/sessions/:id"

# Frontend components can run in parallel:
T062: "VisualizationPanel.tsx"
T063: "AgentStatusCard.tsx"
T064: "ProgressSummary.tsx"
T065: "AgentListView.tsx"

# UI components can run in parallel:
T069: "ProgressBar.tsx"
T070: "StatusBadge.tsx"
T071: "LoadingSpinner.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T054) - CRITICAL
3. Complete Phase 3: User Story 1 (T055-T071)
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo basic agent status visualization

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001-T054)
2. Add User Story 1 → Test → Deploy (MVP with real-time agent status!)
3. Add User Story 2 → Test → Deploy (decision transparency added)
4. Add User Story 4 → Test → Deploy (preview capability added)
5. Add User Story 3 → Test → Deploy (personification added)
6. Add User Story 5 → Test → Deploy (full collaboration view)
7. Add cross-cutting features (error recovery, archiving, metrics) as needed
8. Polish phase before production release

### Parallel Team Strategy

With multiple developers after Foundational phase complete:

- **Developer A**: User Story 1 (Phase 3) - Agent status & progress
- **Developer B**: User Story 2 (Phase 4) - Decision transparency
- **Developer C**: Backend error handling (Phase 8) + archiving (Phase 9)
- **Developer D**: Frontend theme system (Phase 10) + metrics (Phase 11)

Stories integrate independently without conflicts.

---

## Task Count Summary

- **Total Tasks**: 182
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 49 tasks - CRITICAL BLOCKING PHASE
- **Phase 3 (US1)**: 17 tasks - MVP
- **Phase 4 (US2)**: 15 tasks
- **Phase 5 (US4)**: 8 tasks
- **Phase 6 (US3)**: 9 tasks
- **Phase 7 (US5)**: 10 tasks
- **Phase 8 (Error Recovery)**: 8 tasks
- **Phase 9 (Archiving)**: 9 tasks
- **Phase 10 (Theme)**: 8 tasks
- **Phase 11 (Metrics)**: 10 tasks
- **Phase 12 (Performance)**: 9 tasks
- **Phase 13 (WebSocket)**: 7 tasks
- **Phase 14 (Polish)**: 18 tasks

**Parallelizable Tasks**: 87 tasks marked with [P] can run concurrently

**Estimated Timeline**:
- MVP (Phases 1-3): 2-3 weeks (with parallelization)
- Full P1+P2 features (+ Phase 4-5): 4-5 weeks
- Complete feature (all phases): 6-8 weeks

---

## Notes

- All [P] tasks target different files with no dependencies
- Each [Story] label maps task to specific user story for traceability
- User stories 1, 2, 4, 3, 5 can be independently completed and tested
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database migrations must run in order (001-010)
- WebSocket infrastructure (Phase 2) must complete before any real-time features
- Theme system (Phase 10) can be worked on in parallel with user stories
- Performance optimization (Phase 12) should be validated continuously, not just at end
