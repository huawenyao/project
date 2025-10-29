/**
 * useAgent Hook
 *
 * Phase 4 - User Story 2: Agent协作可视化
 * T044: Agent Hook - 管理Agent状态和WebSocket通信
 */

import { useEffect, useCallback } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { useWebSocket } from './useWebSocket';
import type { AgentType, AgentStatus, AgentTask } from '../stores/agentStore';

export interface AgentStatusUpdateEvent {
  agentType: AgentType;
  status: AgentStatus;
  progress?: number;
  currentOperation?: string;
  error?: string;
  timestamp: string;
}

export interface AgentTaskEvent {
  agentType: AgentType;
  task: AgentTask;
  action: 'assigned' | 'started' | 'completed' | 'failed';
  timestamp: string;
}

export interface AgentOutputEvent {
  agentType: AgentType;
  output: string;
  type: 'log' | 'error' | 'warning' | 'info';
  timestamp: string;
}

export interface UseAgentOptions {
  projectId?: string;
  autoConnect?: boolean;
  onAgentUpdate?: (event: AgentStatusUpdateEvent) => void;
  onTaskUpdate?: (event: AgentTaskEvent) => void;
  onAgentOutput?: (event: AgentOutputEvent) => void;
}

/**
 * useAgent Hook
 *
 * 管理 Agent 状态并处理 WebSocket 事件
 */
export function useAgent(options: UseAgentOptions = {}) {
  const {
    projectId,
    autoConnect = true,
    onAgentUpdate,
    onTaskUpdate,
    onAgentOutput,
  } = options;

  const store = useAgentStore();
  const { subscribe, emit, joinSession, isConnected } = useWebSocket({
    autoConnect,
  });

  // 加入项目房间
  useEffect(() => {
    if (projectId && isConnected) {
      joinSession(projectId);
    }
  }, [projectId, isConnected, joinSession]);

  // 订阅 Agent 状态更新
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribeStatus = subscribe(
      'agent:status:update',
      (event: AgentStatusUpdateEvent) => {
        const { agentType, status, progress, currentOperation, error } = event;

        // 更新 store
        store.updateAgentStatus(agentType, status);

        if (progress !== undefined) {
          store.updateAgentProgress(agentType, progress, currentOperation);
        }

        if (error) {
          store.setAgentError(agentType, error);
        }

        // 触发回调
        onAgentUpdate?.(event);
      }
    );

    return unsubscribeStatus;
  }, [autoConnect, subscribe, store, onAgentUpdate]);

  // 订阅 Agent 任务事件
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribeTask = subscribe(
      'agent:task:update',
      (event: AgentTaskEvent) => {
        const { task, action } = event;

        switch (action) {
          case 'assigned':
            store.addTask(task);
            break;
          case 'started':
            store.updateTask(task.id, { status: 'in_progress', startedAt: event.timestamp });
            break;
          case 'completed':
            store.completeTask(task.id);
            break;
          case 'failed':
            store.failTask(task.id, task.errorMessage || 'Unknown error');
            break;
        }

        // 触发回调
        onTaskUpdate?.(event);
      }
    );

    return unsubscribeTask;
  }, [autoConnect, subscribe, store, onTaskUpdate]);

  // 订阅 Agent 输出
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribeOutput = subscribe(
      'agent:output',
      (event: AgentOutputEvent) => {
        // 触发回调
        onAgentOutput?.(event);

        // 可以在这里添加日志收集逻辑
        console.log(`[${event.agentType}] ${event.type}: ${event.output}`);
      }
    );

    return unsubscribeOutput;
  }, [autoConnect, subscribe, onAgentOutput]);

  // 订阅构建开始/完成事件
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribeBuildStart = subscribe('build:started', () => {
      store.startBuild();
    });

    const unsubscribeBuildComplete = subscribe('build:completed', () => {
      store.completeBuild();
    });

    const unsubscribeBuildFailed = subscribe('build:failed', () => {
      store.stopBuild();
    });

    return () => {
      unsubscribeBuildStart();
      unsubscribeBuildComplete();
      unsubscribeBuildFailed();
    };
  }, [autoConnect, subscribe, store]);

  // 请求启动构建
  const startBuild = useCallback(
    (projectId: string, requirements: any) => {
      emit('build:start', {
        projectId,
        requirements,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // 请求停止构建
  const stopBuild = useCallback(
    (projectId: string) => {
      emit('build:stop', {
        projectId,
        timestamp: new Date().toISOString(),
      });
      store.stopBuild();
    },
    [emit, store]
  );

  // 请求暂停 Agent
  const pauseAgent = useCallback(
    (agentType: AgentType) => {
      emit('agent:pause', {
        agentType,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // 请求恢复 Agent
  const resumeAgent = useCallback(
    (agentType: AgentType) => {
      emit('agent:resume', {
        agentType,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // 请求重试失败的任务
  const retryTask = useCallback(
    (taskId: string) => {
      emit('agent:task:retry', {
        taskId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // 获取单个 Agent 状态
  const getAgent = useCallback(
    (agentType: AgentType) => {
      return store.getAgent(agentType);
    },
    [store]
  );

  // 获取所有 Agent 状态
  const getAllAgents = useCallback(() => {
    return Object.values(store.agents);
  }, [store.agents]);

  return {
    // Agent 状态
    agents: store.agents,
    isBuilding: store.isBuilding,
    overallProgress: store.overallProgress,
    taskQueue: store.taskQueue,
    dependencies: store.dependencies,
    connected: store.connected,
    reconnecting: store.reconnecting,

    // Agent 查询
    getAgent,
    getAllAgents,
    getActiveAgents: store.getActiveAgents,
    getIdleAgents: store.getIdleAgents,
    getCompletedAgents: store.getCompletedAgents,
    getFailedAgents: store.getFailedAgents,
    getPendingTasks: store.getPendingTasks,

    // Agent 操作
    startBuild,
    stopBuild,
    pauseAgent,
    resumeAgent,
    retryTask,

    // Store 操作
    updateAgentStatus: store.updateAgentStatus,
    updateAgentProgress: store.updateAgentProgress,
    setAgentError: store.setAgentError,
    addTask: store.addTask,
    updateTask: store.updateTask,
    completeTask: store.completeTask,
    failTask: store.failTask,
    reset: store.reset,
  };
}

export default useAgent;
