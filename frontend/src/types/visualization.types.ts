/**
 * Frontend Visualization Types
 *
 * 前端可视化系统类型定义
 */

// ==================== Agent Types ====================

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';

export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'skipped';

export type Priority = 'high' | 'medium' | 'low';

export type PersonalityTone =
  | 'professional_friendly'
  | 'casual_humorous'
  | 'technical_precise'
  | 'supportive_patient'
  | 'confident_assertive';

// ==================== Build Session ====================

export type BuildSessionStatus = 'in_progress' | 'success' | 'failed' | 'partial_success';

export interface BuildSession {
  sessionId: string;
  userId: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  status: BuildSessionStatus;
  agentList: string[];
  archived: boolean;
  archivedAt?: string;
  storagePath?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Agent Work Status ====================

export interface AgentWorkStatus {
  statusId: string;
  sessionId: string;
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  taskDescription: string;
  progressPercentage: number;
  startTime?: string;
  endTime?: string;
  retryCount: number;
  maxRetry: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Decision Record ====================

export type DecisionType =
  | 'tech_selection'
  | 'ui_design'
  | 'architecture'
  | 'data_model'
  | 'api_design'
  | 'deployment_config'
  | 'other';

export type DecisionImpact = 'high' | 'medium' | 'low';

export interface DecisionReasoning {
  options: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;
  selectedOption: string;
  reasoning: string;
  tradeoffs?: string[];
}

export interface DecisionRecord {
  decisionId: string;
  sessionId: string;
  agentType: AgentType;
  decisionType: DecisionType;
  decisionTitle: string;
  reasoning: DecisionReasoning;
  impact: DecisionImpact;
  affectedComponents: string[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  read?: boolean; // 前端添加的字段
}

// ==================== Agent Error Record ====================

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ErrorResolution =
  | 'resolved'
  | 'retrying'
  | 'user_intervention_required'
  | 'skipped'
  | 'unresolved';

export interface ErrorContext {
  taskId?: string;
  input?: any;
  stackTrace?: string;
  environmentInfo?: Record<string, any>;
}

export interface AgentErrorRecord {
  errorId: string;
  sessionId: string;
  agentType: AgentType;
  errorCode: string;
  errorMessage: string;
  errorContext: ErrorContext;
  severity: ErrorSeverity;
  resolution: ErrorResolution;
  resolutionNotes?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Collaboration Event ====================

export type CollaborationType = 'request' | 'response' | 'notification' | 'data_transfer' | 'handoff';

export interface CollaborationPayload {
  requestType?: string;
  data?: any;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

export interface CollaborationEvent {
  eventId: string;
  sessionId: string;
  sourceAgent: AgentType;
  targetAgent: AgentType;
  collaborationType: CollaborationType;
  payload: CollaborationPayload;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Preview Data ====================

export type PreviewType =
  | 'ui_component'
  | 'api_schema'
  | 'database_schema'
  | 'deployment_config'
  | 'code_snippet';

export interface PreviewDataContent {
  type: PreviewType;
  data: any;
  metadata?: {
    language?: string;
    framework?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface PreviewData {
  previewId: string;
  sessionId: string;
  agentType: AgentType;
  decisionId?: string;
  previewContent: PreviewDataContent;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Agent Persona ====================

export interface AgentPersona {
  agentType: AgentType;
  displayName: string;
  avatarUrl?: string;
  description: string;
  personalityTone: PersonalityTone;
  specialties: string[];
  priority: Priority;
  updateFrequency: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== User Interaction Metric ====================

export type EventType =
  | 'click'
  | 'hover'
  | 'expand'
  | 'collapse'
  | 'filter'
  | 'search'
  | 'export'
  | 'navigate';

export interface EventMetadata {
  targetElement?: string;
  value?: any;
  duration?: number;
  [key: string]: any;
}

export interface UserInteractionMetric {
  eventId: string;
  sessionId: string;
  userId: string;
  eventType: EventType;
  eventMetadata: EventMetadata;
  timestamp: string;
  anonymized: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== WebSocket Events ====================

export interface VisualizationUpdateEvent {
  type: 'agent_status_update' | 'decision_made' | 'error_occurred' | 'collaboration_event' | 'preview_generated';
  sessionId: string;
  data: any;
  timestamp: string;
}

export interface AgentStatusUpdate {
  statusId: string;
  agentType: AgentType;
  status: AgentStatus;
  progressPercentage: number;
  taskDescription: string;
}

export interface DecisionMadeEvent {
  decisionId: string;
  agentType: AgentType;
  decisionTitle: string;
  impact: DecisionImpact;
}

export interface ErrorOccurredEvent {
  errorId: string;
  agentType: AgentType;
  errorMessage: string;
  severity: ErrorSeverity;
}

// ==================== Theme Types ====================

export type ThemeMode = 'warm-friendly' | 'tech-futuristic';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  agent: {
    pending: string;
    inProgress: string;
    completed: string;
    failed: string;
    retrying: string;
    skipped: string;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  borderRadius: string;
  spacing: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  shadows: Record<string, string>;
  transitions: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
}

// ==================== Settings Types ====================

export interface VisualizationSettings {
  theme: ThemeMode;
  focusMode: boolean;
  showLowPriorityAgents: boolean;
  showLowPriorityDecisions: boolean;
  enableAnimations: boolean;
  enableSound: boolean;
  updateFrequency: 'realtime' | 'balanced' | 'slow';
  privacy: {
    enableAnalytics: boolean;
    anonymizeData: boolean;
  };
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== Store State Types ====================

export interface VisualizationState {
  // Current session
  currentSession: BuildSession | null;

  // Agent statuses
  agentStatuses: Record<string, AgentWorkStatus>;

  // Decisions
  decisions: DecisionRecord[];
  unreadDecisions: number;

  // Errors
  errors: AgentErrorRecord[];
  unresolvedErrors: number;

  // Collaborations
  collaborations: CollaborationEvent[];

  // Previews
  previews: Record<string, PreviewData>;

  // Personas
  personas: Record<AgentType, AgentPersona>;

  // Connection status
  connected: boolean;
  reconnecting: boolean;

  // Loading states
  loading: boolean;
  error: string | null;
}

export interface AgentStatusState {
  statuses: Record<string, AgentWorkStatus>;
  activeAgents: AgentType[];
  progress: number;
  lastUpdate: string | null;
}

export interface DecisionState {
  decisions: DecisionRecord[];
  unreadCount: number;
  filter: {
    impact?: DecisionImpact;
    agentType?: AgentType;
    type?: DecisionType;
  };
  selectedDecision: DecisionRecord | null;
}

export interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
}

export interface SettingsState {
  settings: VisualizationSettings;
}

// ==================== Component Props Types ====================

export interface AgentStatusCardProps {
  status: AgentWorkStatus;
  persona?: AgentPersona;
  onClick?: () => void;
  compact?: boolean;
}

export interface DecisionCardProps {
  decision: DecisionRecord;
  preview?: PreviewData;
  onMarkRead?: (id: string) => void;
  onExpand?: (id: string) => void;
}

export interface ErrorCardProps {
  error: AgentErrorRecord;
  onRetry?: (id: string) => void;
  onSkip?: (id: string) => void;
  onAbort?: (id: string) => void;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

export interface StatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
}

// ==================== Graph Types (for ReactFlow) ====================

export interface AgentNode {
  id: string;
  type: 'agent';
  data: {
    agentType: AgentType;
    status: AgentStatus;
    persona?: AgentPersona;
    progressPercentage: number;
  };
  position: { x: number; y: number };
}

export interface CollaborationEdge {
  id: string;
  source: string;
  target: string;
  type: 'collaboration';
  data: {
    collaborationType: CollaborationType;
    count: number;
    lastEvent?: CollaborationEvent;
  };
  animated?: boolean;
}

// ==================== Utility Types ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
