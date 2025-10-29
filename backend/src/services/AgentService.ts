import { Agent } from '@prisma/client';
import AgentModel from '../models/Agent';
import { logger } from '../utils/logger';

/**
 * T015 [P] [US2]: AgentService
 * 提供AI代理相关的业务逻辑，包括代理创建、状态管理、任务分配
 */

export interface CreateAgentData {
  projectId: string;
  agentType: string;
  name: string;
  description?: string;
  capabilities?: string[];
  config?: any;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  capabilities?: any;
  status?: string;
  config?: any;
  currentTask?: string;
  metrics?: any;
}

export interface AgentWithTasks extends Agent {
  tasks?: any[];
  taskStats?: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
  };
}

// 预定义的Agent类型配置
const AGENT_TYPES = {
  ui: {
    name: 'UI Agent',
    description: 'UI组件选择和布局优化',
    capabilities: ['component_selection', 'layout_design', 'styling', 'responsive_design'],
    config: { maxConcurrentTasks: 3 },
  },
  backend: {
    name: 'Backend Agent',
    description: 'API创建和业务逻辑实现',
    capabilities: ['api_design', 'business_logic', 'authentication', 'data_validation'],
    config: { maxConcurrentTasks: 5 },
  },
  database: {
    name: 'Database Agent',
    description: '数据库架构设计和优化',
    capabilities: ['schema_design', 'migration', 'query_optimization', 'indexing'],
    config: { maxConcurrentTasks: 2 },
  },
  integration: {
    name: 'Integration Agent',
    description: '第三方服务集成',
    capabilities: ['api_integration', 'authentication', 'data_transformation', 'error_handling'],
    config: { maxConcurrentTasks: 3 },
  },
  deployment: {
    name: 'Deployment Agent',
    description: '环境设置和部署',
    capabilities: ['environment_setup', 'deployment', 'monitoring', 'scaling'],
    config: { maxConcurrentTasks: 2 },
  },
};

export class AgentService {
  /**
   * 创建新Agent
   */
  static async createAgent(data: CreateAgentData): Promise<Agent> {
    try {
      // 验证输入
      this.validateCreateAgentData(data);

      // 获取Agent类型配置
      const typeConfig = this.getAgentTypeConfig(data.agentType);

      // 合并配置
      const agentData = {
        ...data,
        name: data.name || typeConfig.name,
        description: data.description || typeConfig.description,
        capabilities: data.capabilities || typeConfig.capabilities,
        config: { ...typeConfig.config, ...data.config },
        status: 'idle',
      };

      const agent = await AgentModel.create(agentData);
      logger.info(`Agent created: ${agent.id} (${agent.name}, type: ${agent.type})`);

      return agent;
    } catch (error: any) {
      logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  /**
   * 批量创建项目的所有Agent
   */
  static async createProjectAgents(projectId: string): Promise<Agent[]> {
    try {
      const agents: Agent[] = [];

      // 为每种类型创建一个Agent
      for (const [agentType, typeConfig] of Object.entries(AGENT_TYPES)) {
        const agent = await this.createAgent({
          projectId,
          agentType,
          name: typeConfig.name,
          description: typeConfig.description,
          capabilities: typeConfig.capabilities,
          config: typeConfig.config,
        });

        agents.push(agent);
      }

      logger.info(`Created ${agents.length} agents for project ${projectId}`);
      return agents;
    } catch (error: any) {
      logger.error(`Failed to create agents for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent详情
   */
  static async getAgentById(agentId: string): Promise<Agent | null> {
    try {
      return await AgentModel.findById(agentId);
    } catch (error: any) {
      logger.error(`Failed to get agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent详情（包含任务列表）
   */
  static async getAgentWithTasks(agentId: string): Promise<AgentWithTasks | null> {
    try {
      const agent = await AgentModel.findByIdWithTasks(agentId);

      if (!agent) {
        return null;
      }

      // 获取任务统计
      const taskStats = await AgentModel.getTaskStats(agentId);

      return {
        ...agent,
        taskStats,
      };
    } catch (error: any) {
      logger.error(`Failed to get agent with tasks ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent信息
   */
  static async updateAgent(agentId: string, data: UpdateAgentData): Promise<Agent> {
    try {
      const agent = await AgentModel.update(agentId, data);
      logger.info(`Agent updated: ${agent.id}`);

      return agent;
    } catch (error: any) {
      logger.error(`Failed to update agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent状态
   */
  static async updateAgentStatus(
    agentId: string,
    status: string,
    currentTask?: string
  ): Promise<Agent> {
    try {
      // 验证状态值
      const validStatuses = ['idle', 'active', 'working', 'busy', 'error', 'offline'];
      if (!validStatuses.includes(status)) {
        throw new Error(`无效的状态值: ${status}`);
      }

      const agent = await AgentModel.updateStatus(agentId, status, currentTask);
      logger.info(`Agent status updated: ${agent.id} -> ${status}`);

      return agent;
    } catch (error: any) {
      logger.error(`Failed to update agent status ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新Agent指标
   */
  static async updateAgentMetrics(agentId: string, metrics: any): Promise<Agent> {
    try {
      return await AgentModel.updateMetrics(agentId, metrics);
    } catch (error: any) {
      logger.error(`Failed to update agent metrics ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 记录Agent活跃
   */
  static async recordAgentActivity(agentId: string): Promise<Agent> {
    try {
      return await AgentModel.updateLastActive(agentId);
    } catch (error: any) {
      logger.error(`Failed to record agent activity ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 删除Agent
   */
  static async deleteAgent(agentId: string): Promise<void> {
    try {
      await AgentModel.delete(agentId);
      logger.info(`Agent deleted: ${agentId}`);
    } catch (error: any) {
      logger.error(`Failed to delete agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的所有Agent
   */
  static async getProjectAgents(
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      agentType?: string;
      status?: string;
    } = {}
  ): Promise<Agent[]> {
    try {
      return await AgentModel.findByProjectId(projectId, options);
    } catch (error: any) {
      logger.error(`Failed to get agents for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取活跃的Agent列表
   */
  static async getActiveAgents(projectId?: string): Promise<Agent[]> {
    try {
      return await AgentModel.findActive(projectId);
    } catch (error: any) {
      logger.error('Failed to get active agents:', error);
      throw error;
    }
  }

  /**
   * 根据类型获取可用的Agent
   */
  static async getAvailableAgentByType(
    projectId: string,
    agentType: string
  ): Promise<Agent | null> {
    try {
      return await AgentModel.findAvailableByType(projectId, agentType);
    } catch (error: any) {
      logger.error(`Failed to get available agent of type ${agentType}:`, error);
      throw error;
    }
  }

  /**
   * 分配任务给Agent
   */
  static async assignTask(
    agentId: string,
    taskId: string,
    taskDescription: string
  ): Promise<Agent> {
    try {
      const agent = await AgentModel.findById(agentId);

      if (!agent) {
        throw new Error('Agent不存在');
      }

      // 检查Agent状态
      if (agent.status === 'offline' || agent.status === 'error') {
        throw new Error(`Agent状态异常: ${agent.status}`);
      }

      // 更新Agent状态
      return await this.updateAgentStatus(agentId, 'working', taskDescription);
    } catch (error: any) {
      logger.error(`Failed to assign task to agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 完成Agent任务
   */
  static async completeTask(agentId: string, success: boolean = true): Promise<Agent> {
    try {
      const newStatus = success ? 'idle' : 'error';
      return await this.updateAgentStatus(agentId, newStatus, undefined);
    } catch (error: any) {
      logger.error(`Failed to complete task for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的Agent数量（按类型）
   */
  static async countProjectAgentsByType(projectId: string): Promise<Record<string, number>> {
    try {
      return await AgentModel.countByType(projectId);
    } catch (error: any) {
      logger.error(`Failed to count agents by type for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 统计项目的Agent数量（按状态）
   */
  static async countProjectAgentsByStatus(projectId: string): Promise<Record<string, number>> {
    try {
      return await AgentModel.countByStatus(projectId);
    } catch (error: any) {
      logger.error(`Failed to count agents by status for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * 获取Agent性能指标
   */
  static async getAgentPerformance(agentId: string): Promise<{
    taskStats: any;
    averageTaskDuration?: number;
    successRate?: number;
    lastActiveAt: Date | null;
  }> {
    try {
      const [agent, taskStats] = await Promise.all([
        AgentModel.findById(agentId),
        AgentModel.getTaskStats(agentId),
      ]);

      if (!agent) {
        throw new Error('Agent不存在');
      }

      const successRate = taskStats.total > 0
        ? (taskStats.completed / taskStats.total) * 100
        : 0;

      return {
        taskStats,
        successRate,
        lastActiveAt: agent.lastActiveAt,
      };
    } catch (error: any) {
      logger.error(`Failed to get agent performance ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的Agent摘要
   */
  static async getProjectAgentsSummary(projectId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    activeCount: number;
  }> {
    try {
      const [byType, byStatus, activeAgents] = await Promise.all([
        AgentModel.countByType(projectId),
        AgentModel.countByStatus(projectId),
        AgentModel.findActive(projectId),
      ]);

      const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

      return {
        total,
        byType,
        byStatus,
        activeCount: activeAgents.length,
      };
    } catch (error: any) {
      logger.error(`Failed to get agents summary for project ${projectId}:`, error);
      throw error;
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 获取Agent类型配置
   */
  private static getAgentTypeConfig(agentType: string): any {
    const config = (AGENT_TYPES as any)[agentType];

    if (!config) {
      throw new Error(`未知的Agent类型: ${agentType}`);
    }

    return config;
  }

  /**
   * 验证创建Agent数据
   */
  private static validateCreateAgentData(data: CreateAgentData): void {
    if (!data.projectId) {
      throw new Error('项目ID不能为空');
    }

    if (!data.agentType) {
      throw new Error('Agent类型不能为空');
    }

    if (!Object.keys(AGENT_TYPES).includes(data.agentType)) {
      throw new Error(`无效的Agent类型: ${data.agentType}`);
    }
  }

  /**
   * 获取所有可用的Agent类型
   */
  static getAvailableAgentTypes(): Array<{
    type: string;
    name: string;
    description: string;
    capabilities: string[];
  }> {
    return Object.entries(AGENT_TYPES).map(([type, config]) => ({
      type,
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
    }));
  }
}

export default AgentService;
