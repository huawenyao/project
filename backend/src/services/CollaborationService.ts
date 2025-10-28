/**
 * Collaboration Service
 *
 * Agent 协作管理服务 - 跟踪和管理 Agent 之间的协作事件
 */

import { CollaborationEvent } from '../models';
import {
  CollaborationEventCreationAttributes,
  AgentType,
  CollaborationType,
  ServiceResponse,
} from '../types/visualization.types';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export class CollaborationService {
  /**
   * 记录协作事件
   */
  async recordCollaboration(data: CollaborationEventCreationAttributes): Promise<ServiceResponse<CollaborationEvent>> {
    try {
      const event = await CollaborationEvent.create(data);
      logger.info(`Recorded collaboration: ${event.sourceAgent} -> ${event.targetAgent} (${event.collaborationType})`);

      return {
        success: true,
        data: event,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to record collaboration event:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取会话的所有协作事件
   */
  async getSessionCollaborations(sessionId: string): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: { sessionId },
        order: [['timestamp', 'ASC']],
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaborations for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取特定 Agent 对之间的协作
   */
  async getAgentPairCollaborations(
    sessionId: string,
    sourceAgent: AgentType,
    targetAgent: AgentType
  ): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: {
          sessionId,
          sourceAgent,
          targetAgent,
        },
        order: [['timestamp', 'ASC']],
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaborations between ${sourceAgent} and ${targetAgent}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取 Agent 发起的协作
   */
  async getAgentOutgoingCollaborations(
    sessionId: string,
    agentType: AgentType
  ): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: {
          sessionId,
          sourceAgent: agentType,
        },
        order: [['timestamp', 'ASC']],
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get outgoing collaborations for ${agentType}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取 Agent 接收的协作
   */
  async getAgentIncomingCollaborations(
    sessionId: string,
    agentType: AgentType
  ): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: {
          sessionId,
          targetAgent: agentType,
        },
        order: [['timestamp', 'ASC']],
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get incoming collaborations for ${agentType}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 按协作类型获取事件
   */
  async getCollaborationsByType(
    sessionId: string,
    collaborationType: CollaborationType
  ): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: {
          sessionId,
          collaborationType,
        },
        order: [['timestamp', 'ASC']],
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaborations of type ${collaborationType}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取协作统计
   */
  async getCollaborationStats(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: { sessionId },
      });

      const stats = {
        total: events.length,
        byType: {} as Record<CollaborationType, number>,
        bySourceAgent: {} as Record<AgentType, number>,
        byTargetAgent: {} as Record<AgentType, number>,
        agentPairs: [] as Array<{ source: AgentType; target: AgentType; count: number }>,
      };

      const pairMap = new Map<string, number>();

      events.forEach((event) => {
        // 按类型统计
        stats.byType[event.collaborationType] = (stats.byType[event.collaborationType] || 0) + 1;

        // 按源 Agent 统计
        stats.bySourceAgent[event.sourceAgent] = (stats.bySourceAgent[event.sourceAgent] || 0) + 1;

        // 按目标 Agent 统计
        stats.byTargetAgent[event.targetAgent] = (stats.byTargetAgent[event.targetAgent] || 0) + 1;

        // Agent 对统计
        const pairKey = `${event.sourceAgent}->${event.targetAgent}`;
        pairMap.set(pairKey, (pairMap.get(pairKey) || 0) + 1);
      });

      // 转换 Agent 对统计为数组并排序
      stats.agentPairs = Array.from(pairMap.entries())
        .map(([pair, count]) => {
          const [source, target] = pair.split('->');
          return { source: source as AgentType, target: target as AgentType, count };
        })
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaboration stats for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取最近的协作事件（用于实时更新）
   */
  async getRecentCollaborations(
    sessionId: string,
    limit: number = 10
  ): Promise<ServiceResponse<CollaborationEvent[]>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: { sessionId },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return {
        success: true,
        data: events,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get recent collaborations for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取协作流程图数据（用于可视化）
   */
  async getCollaborationFlow(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: { sessionId },
        order: [['timestamp', 'ASC']],
      });

      // 构建节点和边
      const nodes = new Set<AgentType>();
      const edges: Array<{
        source: AgentType;
        target: AgentType;
        type: CollaborationType;
        count: number;
      }> = [];

      const edgeMap = new Map<string, any>();

      events.forEach((event) => {
        nodes.add(event.sourceAgent);
        nodes.add(event.targetAgent);

        const edgeKey = `${event.sourceAgent}->${event.targetAgent}-${event.collaborationType}`;
        if (edgeMap.has(edgeKey)) {
          edgeMap.get(edgeKey).count++;
        } else {
          edgeMap.set(edgeKey, {
            source: event.sourceAgent,
            target: event.targetAgent,
            type: event.collaborationType,
            count: 1,
          });
        }
      });

      const flowData = {
        nodes: Array.from(nodes).map((agentType) => ({
          id: agentType,
          label: agentType,
        })),
        edges: Array.from(edgeMap.values()),
      };

      return {
        success: true,
        data: flowData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaboration flow for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取 Agent 协作矩阵（用于热力图）
   */
  async getCollaborationMatrix(sessionId: string): Promise<ServiceResponse<any>> {
    try {
      const events = await CollaborationEvent.findAll({
        where: { sessionId },
      });

      const agents: AgentType[] = ['UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'];
      const matrix: number[][] = Array(agents.length)
        .fill(0)
        .map(() => Array(agents.length).fill(0));

      events.forEach((event) => {
        const sourceIndex = agents.indexOf(event.sourceAgent);
        const targetIndex = agents.indexOf(event.targetAgent);
        if (sourceIndex >= 0 && targetIndex >= 0) {
          matrix[sourceIndex][targetIndex]++;
        }
      });

      return {
        success: true,
        data: {
          agents,
          matrix,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get collaboration matrix for session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new CollaborationService();
