/**
 * TypeScript类型定义：AI思考过程可视化系统
 *
 * 这些类型定义在后端和前端之间共享，确保类型安全
 */

// ==================== Agent状态类型 ====================

export type AgentType =
  | 'UIAgent'
  | 'BackendAgent'
  | 'DatabaseAgent'
  | 'IntegrationAgent'
  | 'DeploymentAgent';

export type AgentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'skipped';

export type AgentPriority = 'high' | 'low';

export interface AgentWorkStatusData {
  statusId: string;
  sessionId: string;
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  taskDescription: string;
  progressPercentage: number; // 0-100
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  retryCount: number;
  maxRetry: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 决策记录类型 ====================

export type DecisionImportance = 'high' | 'medium' | 'low';

export interface DecisionRecordData {
  decisionId: string;
  sessionId: string;
  agentId: string;
  agentType: AgentType;
  title: string;
  content: string;
  reasoning: string[]; // 多条理由
  alternatives?: Array<{
    name: string;
    description: string;
  }>;
  tradeoffs?: string;
  importance: DecisionImportance;
  isRead: boolean;
  timestamp: string; // ISO 8601
  createdAt: string;
  // 关联的预览数据
  previews?: PreviewDataItem[];
}

// ==================== 错误记录类型 ====================

export type ErrorType = 'minor' | 'critical';

export type ErrorCategory =
  | 'network_timeout'
  | 'api_rate_limit'
  | 'decision_failure'
  | 'service_unavailable'
  | 'data_validation_error'
  | 'service_missing';

export type ErrorResolution =
  | 'auto_retry_success'
  | 'user_retry'
  | 'user_skip'
  | 'user_abort'
  | 'pending';

export interface AgentErrorRecordData {
  errorId: string;
  sessionId: string;
  agentId: string;
  agentType: AgentType;
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  message: string;
  technicalDetails?: string;
  timestamp: string; // ISO 8601
  retryAttempts: number;
  resolution?: ErrorResolution;
  resolvedAt?: string; // ISO 8601
  createdAt: string;
}

// ==================== 协作事件类型 ====================

export type CollaborationDataType =
  | 'schema'
  | 'api_definition'
  | 'ui_config'
  | 'deployment_manifest';

export interface CollaborationEventData {
  eventId: string;
  sessionId: string;
  sourceAgentId: string;
  sourceAgentType: AgentType;
  targetAgentId: string;
  targetAgentType: AgentType;
  dataSummary: string;
  dataType: CollaborationDataType;
  timestamp: string; // ISO 8601
  createdAt: string;
}

// ==================== 预览数据类型 ====================

export type PreviewType = 'image' | 'html' | 'json' | 'diagram';

export interface PreviewDataItem {
  previewId: string;
  decisionId: string;
  previewType: PreviewType;
  previewContent: string; // URL或内联数据
  title?: string;
  description?: string;
  createdAt: string;
}

// ==================== 构建会话类型 ====================

export type SessionStatus =
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'partial_success';

export interface BuildSessionData {
  sessionId: string;
  userId: string;
  projectId: string;
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  status: SessionStatus;
  agentList: Array<{
    agentId: string;
    agentType: AgentType;
  }>;
  archived: boolean;
  archivedAt?: string; // ISO 8601
  storagePath?: string; // S3 key
  createdAt: string;
  updatedAt: string;
}

export interface BuildSessionSummary {
  sessionId: string;
  projectId: string;
  projectName: string;
  userId: string;
  status: SessionStatus;
  startTime: string;
  endTime?: string;
  duration?: number; // 持续时长（秒）
  agentsCount: number;
  decisionsCount: number;
  errorSummary?: string;
  isArchived: boolean;
  dataSource: 'database' | 'archive';
}

// ==================== Agent拟人化配置 ====================

export type PersonalityTone = 'professional_friendly';

export interface AgentPersonaData {
  agentType: AgentType;
  displayName: string; // 如 "UI设计师"
  avatarUrl: string;
  statusTemplate: string; // 如 "{agent_name}正在{task_description}..."
  colorTheme: string; // 十六进制色值
  priority: AgentPriority;
  personalityTone: PersonalityTone;
  createdAt: string;
  updatedAt: string;
}

// ==================== 用户交互指标 ====================

export type MetricEventType =
  | 'decision_card_click'
  | 'decision_expand'
  | 'agent_card_interaction'
  | 'replay_usage'
  | 'theme_switch'
  | 'focus_mode_toggle'
  | 'build_abandon'
  | 'error_recovery_action';

export interface UserInteractionMetricEvent {
  eventId: string;
  eventType: MetricEventType;
  timestamp: string; // ISO 8601
  anonymousSessionId: string; // 匿名会话ID
  context?: Record<string, any>; // 上下文（不含PII）
  optedIn: boolean;
  createdAt: string;
}

// ==================== WebSocket事件类型 ====================

export interface AgentStatusUpdateEvent {
  sessionId: string;
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  previousStatus?: AgentStatus;
  currentTask: string;
  progress: number; // 0-100
  startTime?: string;
  endTime?: string;
  duration?: number; // 持续时长（秒）
  retryCount: number;
  timestamp: string;
  metadata?: {
    estimatedRemainingTime?: number; // 预计剩余时间（秒）
    [key: string]: any;
  };
}

export interface DecisionCreatedEvent {
  sessionId: string;
  decision: DecisionRecordData;
  timestamp: string;
}

export interface CollaborationEvent {
  sessionId: string;
  collaboration: CollaborationEventData;
  timestamp: string;
}

export interface ErrorOccurredEvent {
  sessionId: string;
  error: AgentErrorRecordData;
  retryState: {
    canAutoRetry: boolean;
    remainingRetries: number;
    nextRetryDelay?: number; // 毫秒
  };
  timestamp: string;
}

export interface SessionCompletedEvent {
  sessionId: string;
  status: SessionStatus;
  summary: {
    totalDuration: number; // 秒
    completedAgents: number;
    failedAgents: number;
    skippedAgents: number;
    totalDecisions: number;
    totalErrors: number;
  };
  timestamp: string;
}

// ==================== API请求/响应类型 ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface SessionListResponse {
  sessions: BuildSessionSummary[];
  pagination: PaginationMeta;
  dataSource: 'database' | 'archive' | 'mixed';
}

export interface SessionDetailResponse {
  session: BuildSessionData;
  agents: AgentWorkStatusData[];
  decisions: DecisionRecordData[];
  collaborations: CollaborationEventData[];
  errors: AgentErrorRecordData[];
  dataSource: 'database' | 'archive';
}

// ==================== 主题类型 ====================

export type ThemeType = 'warm' | 'tech';

export interface ThemeSettings {
  theme: ThemeType;
  updatedAt: string;
}

// ==================== 隐私设置 ====================

export interface PrivacySettings {
  dataCollectionEnabled: boolean;
  showHighImportanceToasts: boolean;
  updatedAt: string;
}
