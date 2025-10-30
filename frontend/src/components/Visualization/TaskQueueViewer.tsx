/**
 * Task Queue Viewer
 *
 * Phase 2 Week 5 - 任务队列可视化
 * 显示所有Agent的任务队列和执行状态
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface Task {
  id: string;
  agentType: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  startTime?: string;
  endTime?: string;
  dependencies?: string[];
  progress?: number;
  error?: string;
}

export interface TaskQueueViewerProps {
  tasks: Task[];
  className?: string;
}

const AGENT_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  UIAgent: { name: 'UI设计师', icon: '🎨', color: 'blue' },
  BackendAgent: { name: '后端工程师', icon: '⚙️', color: 'green' },
  DatabaseAgent: { name: '数据库专家', icon: '🗄️', color: 'purple' },
  IntegrationAgent: { name: '集成专家', icon: '🔗', color: 'orange' },
  DeploymentAgent: { name: '部署工程师', icon: '🚀', color: 'red' },
};

const STATUS_CONFIG = {
  pending: {
    label: '等待中',
    icon: <Clock className="w-4 h-4" />,
    color: 'yellow',
  },
  in_progress: {
    label: '进行中',
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
};

const PRIORITY_CONFIG = {
  low: { label: '低', color: 'gray' },
  medium: { label: '中', color: 'yellow' },
  high: { label: '高', color: 'red' },
};

/**
 * 单个任务卡片
 */
const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);
  const agentConfig = AGENT_CONFIG[task.agentType] || {
    name: task.agentType,
    icon: '🤖',
    color: 'gray',
  };
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all
        ${
          task.status === 'in_progress'
            ? `border-${agentConfig.color}-500 bg-${agentConfig.color}-50 dark:bg-${agentConfig.color}-900/20`
            : task.status === 'completed'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : task.status === 'failed'
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agentConfig.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {task.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {agentConfig.name}
            </p>
          </div>
        </div>

        {/* 优先级 */}
        <span
          className={`
            text-xs px-2 py-1 rounded-full font-medium
            bg-${priorityConfig.color}-100 dark:bg-${priorityConfig.color}-900/30
            text-${priorityConfig.color}-700 dark:text-${priorityConfig.color}-300
          `}
        >
          {priorityConfig.label}
        </span>
      </div>

      {/* 状态和进度 */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
            bg-${statusConfig.color}-100 dark:bg-${statusConfig.color}-900/30
            text-${statusConfig.color}-700 dark:text-${statusConfig.color}-300
          `}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>

        {task.status === 'in_progress' && task.progress !== undefined && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {task.progress}%
          </span>
        )}
      </div>

      {/* 进度条 */}
      {task.status === 'in_progress' && task.progress !== undefined && (
        <div className="mb-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${agentConfig.color}-500 transition-all duration-500`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 描述（可展开） */}
      {task.description && (
        <div className="mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
                     flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? '收起' : '查看详情'}
          </button>
          {expanded && (
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
              {task.description}
            </p>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {task.error && task.status === 'failed' && (
        <div className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{task.error}</span>
        </div>
      )}

      {/* 时间信息 */}
      {(task.startTime || task.endTime) && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
          {task.startTime && (
            <span>开始: {new Date(task.startTime).toLocaleTimeString('zh-CN')}</span>
          )}
          {task.endTime && (
            <span>结束: {new Date(task.endTime).toLocaleTimeString('zh-CN')}</span>
          )}
        </div>
      )}

      {/* 依赖 */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          依赖: {task.dependencies.join(', ')}
        </div>
      )}
    </div>
  );
};

/**
 * 任务队列查看器主组件
 */
export const TaskQueueViewer: React.FC<TaskQueueViewerProps> = ({
  tasks = [],
  className = '',
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');

  // 过滤任务
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterAgent !== 'all' && task.agentType !== filterAgent) return false;
    return true;
  });

  // 统计
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 标题和统计 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          任务队列
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            总计: <strong>{stats.total}</strong>
          </span>
          <span className="text-yellow-600">
            等待: <strong>{stats.pending}</strong>
          </span>
          <span className="text-blue-600">
            进行: <strong>{stats.inProgress}</strong>
          </span>
          <span className="text-green-600">
            完成: <strong>{stats.completed}</strong>
          </span>
          {stats.failed > 0 && (
            <span className="text-red-600">
              失败: <strong>{stats.failed}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-4 mb-4">
        {/* 状态过滤 */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">所有状态</option>
          <option value="pending">等待中</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>

        {/* Agent过滤 */}
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">所有Agent</option>
          {Object.entries(AGENT_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} {config.name}
            </option>
          ))}
        </select>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium">暂无任务</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskQueueViewer;
