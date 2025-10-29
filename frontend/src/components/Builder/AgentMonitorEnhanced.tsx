/**
 * Enhanced Agent Monitor Component
 *
 * Phase 2 - 集成WebSocket实时状态更新
 */

import React, { useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAgentStatusStore } from '../../stores/agentStatusStore';

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type AgentStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';

export interface AgentState {
  statusId: string;
  type: AgentType;
  status: AgentStatus;
  taskDescription?: string;
  progressPercentage: number;
  currentOperation?: string;
  retryCount?: number;
  maxRetry?: number;
  errorMessage?: string;
  startTime?: string;
}

export interface AgentMonitorEnhancedProps {
  sessionId?: string;
  onAgentClick?: (agent: AgentState) => void;
  className?: string;
}

const AGENT_CONFIG: Record<AgentType, {
  name: string;
  icon: string;
  description: string;
  color: string;
}> = {
  UIAgent: {
    name: 'UI设计师',
    icon: '🎨',
    description: '负责组件选择和布局设计',
    color: 'blue',
  },
  BackendAgent: {
    name: '后端工程师',
    icon: '⚙️',
    description: '负责API设计和业务逻辑',
    color: 'green',
  },
  DatabaseAgent: {
    name: '数据库专家',
    icon: '🗄️',
    description: '负责数据模型设计',
    color: 'purple',
  },
  IntegrationAgent: {
    name: '集成专家',
    icon: '🔗',
    description: '负责第三方集成',
    color: 'orange',
  },
  DeploymentAgent: {
    name: '部署工程师',
    icon: '🚀',
    description: '负责环境配置和部署',
    color: 'red',
  },
};

const STATUS_CONFIG: Record<AgentStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  idle: {
    label: '空闲',
    icon: <Clock className="w-4 h-4" />,
    color: 'gray',
  },
  pending: {
    label: '等待中',
    icon: <Clock className="w-4 h-4" />,
    color: 'yellow',
  },
  in_progress: {
    label: '工作中',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'blue',
  },
  completed: {
    label: '已完成',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'green',
  },
  failed: {
    label: '失败',
    icon: <XCircle className="w-4 h-4" />,
    color: 'red',
  },
  retrying: {
    label: '重试中',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'orange',
  },
};

export const AgentMonitorEnhanced: React.FC<AgentMonitorEnhancedProps> = ({
  sessionId,
  onAgentClick,
  className = '',
}) => {
  const { connected, subscribe, joinSession, leaveSession } = useWebSocket();
  const {
    statuses,
    activeAgents,
    progress,
    lastUpdate,
    updateStatus,
    getActiveAgentStatuses,
  } = useAgentStatusStore();

  // 连接到session
  useEffect(() => {
    if (sessionId) {
      joinSession(sessionId);

      return () => {
        leaveSession(sessionId);
      };
    }
  }, [sessionId, joinSession, leaveSession]);

  // 订阅agent状态更新
  useEffect(() => {
    const unsubscribers = [
      // Agent状态更新
      subscribe('agentStatus', (data: AgentState) => {
        updateStatus(data);
      }),

      // Agent任务完成
      subscribe('agentTaskComplete', (data: AgentState) => {
        updateStatus({ ...data, status: 'completed', progressPercentage: 100 });
      }),

      // Agent错误
      subscribe('agentError', (data: AgentState & { error: string }) => {
        updateStatus({
          ...data,
          status: 'failed',
          errorMessage: data.error,
        });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, updateStatus]);

  // 将statuses转换为数组，并确保所有agent类型都有
  const agents = useMemo(() => {
    const allAgentTypes: AgentType[] = [
      'UIAgent',
      'BackendAgent',
      'DatabaseAgent',
      'IntegrationAgent',
      'DeploymentAgent',
    ];

    return allAgentTypes.map((type) => {
      // 查找该类型agent的最新状态
      const agentStatus = Object.values(statuses).find((s) => s.agentType === type);

      if (agentStatus) {
        return {
          statusId: agentStatus.statusId,
          type: agentStatus.agentType as AgentType,
          status: agentStatus.status,
          taskDescription: agentStatus.taskDescription,
          progressPercentage: agentStatus.progressPercentage,
          currentOperation: agentStatus.currentOperation,
          retryCount: agentStatus.retryCount,
          maxRetry: agentStatus.maxRetry,
          errorMessage: agentStatus.errorMessage,
          startTime: agentStatus.startTime,
        };
      }

      // 如果没有状态，返回idle状态
      return {
        statusId: `${type}_idle`,
        type,
        status: 'idle' as AgentStatus,
        progressPercentage: 0,
      };
    });
  }, [statuses]);

  return (
    <div className={`w-full ${className}`}>
      {/* 标题和连接状态 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            AI Agent 协作进度
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            实时查看各个AI Agent的工作状态
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Wifi className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">已连接</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">未连接</span>
            </>
          )}
        </div>
      </div>

      {/* 活动Agent数量 */}
      {activeAgents.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🤖 <strong>{activeAgents.length}</strong> 个Agent正在工作中
          </p>
        </div>
      )}

      {/* Agent卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const config = AGENT_CONFIG[agent.type];
          const statusConfig = STATUS_CONFIG[agent.status];

          return (
            <div
              key={agent.statusId}
              onClick={() => onAgentClick?.(agent)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${
                  agent.status === 'in_progress' || agent.status === 'retrying'
                    ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20 shadow-lg`
                    : agent.status === 'completed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : agent.status === 'failed'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
                hover:shadow-lg hover:scale-105
              `}
            >
              {/* 头部：图标和名称 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{config.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {config.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* 状态标签 */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    bg-${statusConfig.color}-100 dark:bg-${statusConfig.color}-900/30
                    text-${statusConfig.color}-700 dark:text-${statusConfig.color}-300
                  `}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                {agent.retryCount !== undefined && agent.retryCount > 0 && (
                  <span className="text-xs text-gray-500">
                    (重试 {agent.retryCount}/{agent.maxRetry || 3})
                  </span>
                )}
              </div>

              {/* 任务描述 */}
              {agent.taskDescription && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {agent.taskDescription}
                </p>
              )}

              {/* 当前操作 */}
              {agent.currentOperation && agent.status === 'in_progress' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                  ⏳ {agent.currentOperation}
                </p>
              )}

              {/* 错误信息 */}
              {agent.errorMessage && agent.status === 'failed' && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                  ❌ {agent.errorMessage}
                </p>
              )}

              {/* 开始时间 */}
              {agent.startTime && agent.status === 'in_progress' && (
                <p className="text-xs text-gray-500 mb-3">
                  开始时间: {new Date(agent.startTime).toLocaleTimeString('zh-CN')}
                </p>
              )}

              {/* 进度条 */}
              {(agent.status === 'in_progress' || agent.status === 'retrying') && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>进度</span>
                    <span>{agent.progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${config.color}-500 transition-all duration-500`}
                      style={{ width: `${agent.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 完成标记 */}
              {agent.status === 'completed' && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 总体进度 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            总体进度
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {progress}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500 mt-2">
            最后更新: {new Date(lastUpdate).toLocaleTimeString('zh-CN')}
          </p>
        )}
      </div>
    </div>
  );
};

export default AgentMonitorEnhanced;
