/**
 * Agent Monitor Component
 *
 * Sprint 1 - US2: Agent协作可视化
 * T043: Agent监控面板
 */

import React from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type AgentStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  taskDescription?: string;
  progressPercentage: number;
  currentOperation?: string;
  retryCount?: number;
  errorMessage?: string;
}

export interface AgentMonitorProps {
  agents: AgentState[];
  onAgentClick?: (agent: AgentState) => void;
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

export const AgentMonitor: React.FC<AgentMonitorProps> = ({
  agents,
  onAgentClick,
}) => {
  return (
    <div className="w-full">
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          AI Agent 协作进度
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          实时查看各个AI Agent的工作状态
        </p>
      </div>

      {/* Agent卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const config = AGENT_CONFIG[agent.type];
          const statusConfig = STATUS_CONFIG[agent.status];

          return (
            <div
              key={agent.type}
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
                {agent.retryCount && agent.retryCount > 0 && (
                  <span className="text-xs text-gray-500">
                    (重试 {agent.retryCount})
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
            {Math.round(
              agents.reduce((sum, agent) => sum + agent.progressPercentage, 0) /
                agents.length
            )}
            %
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{
              width: `${
                agents.reduce((sum, agent) => sum + agent.progressPercentage, 0) /
                agents.length
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentMonitor;
