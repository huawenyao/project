/**
 * Agent服务（新版）
 * 处理AI Agent相关的API调用
 */

import apiClient from './apiClient';

export interface Agent {
  id: string;
  projectId?: string;
  type: string;
  name: string;
  description?: string;
  capabilities: any;
  status: string;
  performance?: any;
  config?: any;
  currentTask?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentData {
  projectId?: string;
  type: string;
  name: string;
  description?: string;
  capabilities?: any;
  config?: any;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  capabilities?: any;
  config?: any;
}

export interface AgentPerformance {
  successRate: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
}

export interface AgentType {
  type: string;
  name: string;
  description: string;
  capabilities: string[];
}

/**
 * Agent服务类
 */
class AgentServiceNew {
  private basePath = '/api/agents-v2';

  /**
   * 创建Agent
   */
  async createAgent(data: CreateAgentData): Promise<Agent> {
    return apiClient.post<Agent>(this.basePath, data);
  }

  /**
   * 批量创建项目的所有Agent
   */
  async createProjectAgents(projectId: string): Promise<Agent[]> {
    return apiClient.post<Agent[]>(`${this.basePath}/batch`, { projectId });
  }

  /**
   * 获取可用的Agent类型
   */
  async getAgentTypes(): Promise<AgentType[]> {
    return apiClient.get<AgentType[]>(`${this.basePath}/types`);
  }

  /**
   * 获取Agent详情
   */
  async getAgent(id: string): Promise<Agent> {
    return apiClient.get<Agent>(`${this.basePath}/${id}`);
  }

  /**
   * 获取Agent性能指标
   */
  async getAgentPerformance(id: string): Promise<AgentPerformance> {
    return apiClient.get<AgentPerformance>(`${this.basePath}/${id}/performance`);
  }

  /**
   * 更新Agent
   */
  async updateAgent(id: string, data: UpdateAgentData): Promise<Agent> {
    return apiClient.put<Agent>(`${this.basePath}/${id}`, data);
  }

  /**
   * 更新Agent状态
   */
  async updateAgentStatus(id: string, status: string, currentTask?: string): Promise<Agent> {
    return apiClient.patch<Agent>(`${this.basePath}/${id}/status`, { status, currentTask });
  }

  /**
   * 删除Agent
   */
  async deleteAgent(id: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * 获取项目的所有Agent
   */
  async getProjectAgents(projectId: string, params?: {
    type?: string;
    status?: string;
  }): Promise<Agent[]> {
    return apiClient.get<Agent[]>(`${this.basePath}/project/${projectId}`, { params });
  }

  /**
   * 获取项目Agent摘要
   */
  async getProjectAgentSummary(projectId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    return apiClient.get(`${this.basePath}/project/${projectId}/summary`);
  }
}

export const agentServiceNew = new AgentServiceNew();
export default agentServiceNew;
