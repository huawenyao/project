/**
 * Visualization API Client
 *
 * REST API 客户端 - 处理所有可视化相关的 HTTP 请求
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  BuildSession,
  AgentWorkStatus,
  DecisionRecord,
  AgentErrorRecord,
  CollaborationEvent,
  PreviewData,
  AgentPersona,
  AgentType,
} from '../types/visualization.types';

class VisualizationAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证 token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token 过期或无效
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== Session APIs ====================

  async createSession(data: {
    userId: string;
    projectId: string;
    agentList: string[];
  }): Promise<BuildSession> {
    const response = await this.client.post<ApiResponse<BuildSession>>(
      '/api/visualization/sessions',
      data
    );
    return response.data.data!;
  }

  async getSession(sessionId: string): Promise<BuildSession> {
    const response = await this.client.get<ApiResponse<BuildSession>>(
      `/api/visualization/sessions/${sessionId}`
    );
    return response.data.data!;
  }

  async getSessionSnapshot(sessionId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/visualization/sessions/${sessionId}/snapshot`
    );
    return response.data.data!;
  }

  async updateSessionStatus(
    sessionId: string,
    status: string,
    endTime?: string
  ): Promise<BuildSession> {
    const response = await this.client.patch<ApiResponse<BuildSession>>(
      `/api/visualization/sessions/${sessionId}/status`,
      { status, endTime }
    );
    return response.data.data!;
  }

  async getUserSessions(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    includeArchived: boolean = false
  ): Promise<PaginatedResponse<BuildSession>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<BuildSession>>>(
      `/api/visualization/users/${userId}/sessions`,
      {
        params: { page, pageSize, includeArchived },
      }
    );
    return response.data.data!;
  }

  async getProjectSessions(
    projectId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<BuildSession>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<BuildSession>>>(
      `/api/visualization/projects/${projectId}/sessions`,
      {
        params: { page, pageSize },
      }
    );
    return response.data.data!;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.delete(`/api/visualization/sessions/${sessionId}`);
  }

  // ==================== Agent Status APIs ====================

  async createAgentStatus(data: {
    sessionId: string;
    agentId: string;
    agentType: AgentType;
    taskDescription: string;
  }): Promise<AgentWorkStatus> {
    const response = await this.client.post<ApiResponse<AgentWorkStatus>>(
      '/api/visualization/agent-statuses',
      data
    );
    return response.data.data!;
  }

  async updateAgentStatus(
    statusId: string,
    updates: {
      status?: string;
      progressPercentage?: number;
      lastError?: string;
    }
  ): Promise<AgentWorkStatus> {
    const response = await this.client.patch<ApiResponse<AgentWorkStatus>>(
      `/api/visualization/agent-statuses/${statusId}`,
      updates
    );
    return response.data.data!;
  }

  async getSessionAgentStatuses(sessionId: string): Promise<AgentWorkStatus[]> {
    const response = await this.client.get<ApiResponse<AgentWorkStatus[]>>(
      `/api/visualization/sessions/${sessionId}/agent-statuses`
    );
    return response.data.data!;
  }

  async getSessionProgress(sessionId: string): Promise<number> {
    const response = await this.client.get<ApiResponse<number>>(
      `/api/visualization/sessions/${sessionId}/progress`
    );
    return response.data.data!;
  }

  async getAgentPersonas(): Promise<AgentPersona[]> {
    const response = await this.client.get<ApiResponse<AgentPersona[]>>(
      '/api/visualization/agent-personas'
    );
    return response.data.data!;
  }

  // ==================== Decision APIs ====================

  async createDecision(data: {
    sessionId: string;
    agentType: AgentType;
    decisionType: string;
    decisionTitle: string;
    reasoning: any;
    impact: string;
    affectedComponents: string[];
    timestamp: string;
  }): Promise<DecisionRecord> {
    const response = await this.client.post<ApiResponse<DecisionRecord>>(
      '/api/visualization/decisions',
      data
    );
    return response.data.data!;
  }

  async getSessionDecisions(
    sessionId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<DecisionRecord>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<DecisionRecord>>>(
      `/api/visualization/sessions/${sessionId}/decisions`,
      {
        params: { page, pageSize },
      }
    );
    return response.data.data!;
  }

  async getDecisionDetails(decisionId: string): Promise<DecisionRecord> {
    const response = await this.client.get<ApiResponse<DecisionRecord>>(
      `/api/visualization/decisions/${decisionId}`
    );
    return response.data.data!;
  }

  async getDecisionStats(sessionId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/visualization/sessions/${sessionId}/decisions/stats`
    );
    return response.data.data!;
  }

  async searchDecisions(sessionId: string, query: string): Promise<DecisionRecord[]> {
    const response = await this.client.get<ApiResponse<DecisionRecord[]>>(
      `/api/visualization/sessions/${sessionId}/decisions/search`,
      {
        params: { q: query },
      }
    );
    return response.data.data!;
  }

  // ==================== Error APIs ====================

  async recordError(data: {
    sessionId: string;
    agentType: AgentType;
    errorCode: string;
    errorMessage: string;
    errorContext: any;
    severity: string;
    resolution: string;
    timestamp: string;
  }): Promise<AgentErrorRecord> {
    const response = await this.client.post<ApiResponse<AgentErrorRecord>>(
      '/api/visualization/errors',
      data
    );
    return response.data.data!;
  }

  async updateErrorResolution(
    errorId: string,
    resolution: string,
    resolutionNotes?: string
  ): Promise<AgentErrorRecord> {
    const response = await this.client.patch<ApiResponse<AgentErrorRecord>>(
      `/api/visualization/errors/${errorId}/resolution`,
      { resolution, resolutionNotes }
    );
    return response.data.data!;
  }

  async getSessionErrors(sessionId: string): Promise<AgentErrorRecord[]> {
    const response = await this.client.get<ApiResponse<AgentErrorRecord[]>>(
      `/api/visualization/sessions/${sessionId}/errors`
    );
    return response.data.data!;
  }

  async getErrorStats(sessionId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/visualization/sessions/${sessionId}/errors/stats`
    );
    return response.data.data!;
  }

  // ==================== Collaboration APIs ====================

  async recordCollaboration(data: {
    sessionId: string;
    sourceAgent: AgentType;
    targetAgent: AgentType;
    collaborationType: string;
    payload: any;
    timestamp: string;
  }): Promise<CollaborationEvent> {
    const response = await this.client.post<ApiResponse<CollaborationEvent>>(
      '/api/visualization/collaborations',
      data
    );
    return response.data.data!;
  }

  async getSessionCollaborations(sessionId: string): Promise<CollaborationEvent[]> {
    const response = await this.client.get<ApiResponse<CollaborationEvent[]>>(
      `/api/visualization/sessions/${sessionId}/collaborations`
    );
    return response.data.data!;
  }

  async getCollaborationFlow(sessionId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/visualization/sessions/${sessionId}/collaborations/flow`
    );
    return response.data.data!;
  }

  async getCollaborationStats(sessionId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/visualization/sessions/${sessionId}/collaborations/stats`
    );
    return response.data.data!;
  }
}

export default new VisualizationAPI();
