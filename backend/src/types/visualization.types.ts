/**
 * AI Thinking Visualization System - Type Definitions
 *
 * 定义了可视化系统的所有核心数据类型
 */

import { Optional } from 'sequelize';

// ==================== Build Session ====================

export type BuildSessionStatus = 'in_progress' | 'success' | 'failed' | 'partial_success';

export interface BuildSessionData {
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

export interface BuildSessionCreationAttributes extends Optional<BuildSessionData, 'sessionId' | 'endTime' | 'archived' | 'archivedAt' | 'storagePath' | 'createdAt' | 'updatedAt'> {}

// ==================== Agent Work Status ====================

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'skipped';

export interface AgentWorkStatusData {
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

export interface AgentWorkStatusCreationAttributes extends Optional<AgentWorkStatusData, 'statusId' | 'startTime' | 'endTime' | 'retryCount' | 'maxRetry' | 'lastError' | 'createdAt' | 'updatedAt'> {}

// ==================== Decision Record ====================

export type DecisionType = 'tech_selection' | 'ui_design' | 'architecture' | 'data_model' | 'api_design' | 'deployment_config' | 'other';
export type DecisionImpact = 'high' | 'medium' | 'low';

export interface DecisionReasoning {
  options: Array<{ name: string; pros: string[]; cons: string[] }>;
  selectedOption: string;
  reasoning: string;
  tradeoffs?: string[];
}

export interface DecisionRecordData {
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
}

export interface DecisionRecordCreationAttributes extends Optional<DecisionRecordData, 'decisionId' | 'createdAt' | 'updatedAt'> {}

// ==================== Agent Error Record ====================

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ErrorResolution = 'resolved' | 'retrying' | 'user_intervention_required' | 'skipped' | 'unresolved';

export interface ErrorContext {
  taskId?: string;
  input?: any;
  stackTrace?: string;
  environmentInfo?: Record<string, any>;
}

export interface ErrorRecordData {
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

export interface ErrorRecordCreationAttributes extends Optional<ErrorRecordData, 'errorId' | 'resolutionNotes' | 'createdAt' | 'updatedAt'> {}

// ==================== Collaboration Event ====================

export type CollaborationType = 'request' | 'response' | 'notification' | 'data_transfer' | 'handoff';

export interface CollaborationPayload {
  requestType?: string;
  data?: any;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

export interface CollaborationEventData {
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

export interface CollaborationEventCreationAttributes extends Optional<CollaborationEventData, 'eventId' | 'createdAt' | 'updatedAt'> {}

// ==================== Preview Data ====================

export type PreviewType = 'ui_component' | 'api_schema' | 'database_schema' | 'deployment_config' | 'code_snippet';

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

export interface PreviewDataRecord {
  previewId: string;
  sessionId: string;
  agentType: AgentType;
  decisionId?: string;
  previewContent: PreviewDataContent;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewDataCreationAttributes extends Optional<PreviewDataRecord, 'previewId' | 'decisionId' | 'createdAt' | 'updatedAt'> {}

// ==================== Agent Persona ====================

export type PersonalityTone = 'professional_friendly' | 'casual_humorous' | 'technical_precise' | 'supportive_patient' | 'confident_assertive';
export type Priority = 'high' | 'medium' | 'low';

export interface AgentPersonaData {
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

export interface AgentPersonaCreationAttributes extends Optional<AgentPersonaData, 'avatarUrl' | 'createdAt' | 'updatedAt'> {}

// ==================== User Interaction Metric Event ====================

export type EventType = 'click' | 'hover' | 'expand' | 'collapse' | 'filter' | 'search' | 'export' | 'navigate';

export interface EventMetadata {
  targetElement?: string;
  value?: any;
  duration?: number;
  [key: string]: any;
}

export interface UserInteractionMetricData {
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

export interface UserInteractionMetricCreationAttributes extends Optional<UserInteractionMetricData, 'eventId' | 'anonymized' | 'createdAt' | 'updatedAt'> {}

// ==================== WebSocket Event Types ====================

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

// ==================== Service Response Types ====================

export interface ServiceResponse<T> {
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
