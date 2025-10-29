/**
 * Deployment Progress Component
 *
 * Phase 2 Week 7 - 部署进度显示
 * 显示5阶段部署流程：building → uploading → configuring → starting → health_check
 */

import React, { useState } from 'react';
import {
  Package,
  Upload,
  Settings,
  Play,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
} from 'lucide-react';

export type DeploymentStage =
  | 'building'
  | 'uploading'
  | 'configuring'
  | 'starting'
  | 'health_check';

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface DeploymentStageInfo {
  stage: DeploymentStage;
  status: StageStatus;
  startTime?: string;
  endTime?: string;
  progress?: number;
  message?: string;
  logs?: string[];
  error?: string;
}

export interface DeploymentProgressProps {
  deploymentId: string;
  stages: DeploymentStageInfo[];
  currentStage?: DeploymentStage;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

const STAGE_CONFIG: Record<
  DeploymentStage,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }
> = {
  building: {
    label: '构建应用',
    icon: <Package className="w-5 h-5" />,
    color: 'blue',
    description: '编译代码，安装依赖，生成构建产物',
  },
  uploading: {
    label: '上传文件',
    icon: <Upload className="w-5 h-5" />,
    color: 'purple',
    description: '将构建产物上传到服务器',
  },
  configuring: {
    label: '配置环境',
    icon: <Settings className="w-5 h-5" />,
    color: 'yellow',
    description: '配置环境变量和运行参数',
  },
  starting: {
    label: '启动服务',
    icon: <Play className="w-5 h-5" />,
    color: 'green',
    description: '启动应用服务',
  },
  health_check: {
    label: '健康检查',
    icon: <Activity className="w-5 h-5" />,
    color: 'teal',
    description: '验证服务是否正常运行',
  },
};

const STATUS_CONFIG: Record<
  StageStatus,
  {
    icon: React.ReactNode;
    color: string;
  }
> = {
  pending: {
    icon: <Clock className="w-5 h-5" />,
    color: 'gray',
  },
  in_progress: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'blue',
  },
  completed: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'green',
  },
  failed: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'red',
  },
};

/**
 * 单个阶段卡片
 */
const StageCard: React.FC<{
  stage: DeploymentStageInfo;
  isCurrent?: boolean;
}> = ({ stage, isCurrent }) => {
  const [showLogs, setShowLogs] = useState(false);
  const config = STAGE_CONFIG[stage.stage];
  const statusConfig = STATUS_CONFIG[stage.status];

  const duration =
    stage.startTime && stage.endTime
      ? Math.round(
          (new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 1000
        )
      : null;

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all
        ${
          stage.status === 'in_progress'
            ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20 shadow-lg`
            : stage.status === 'completed'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : stage.status === 'failed'
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`
              p-2 rounded-lg
              ${
                stage.status === 'in_progress'
                  ? `bg-${config.color}-500 text-white`
                  : stage.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : stage.status === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            {config.icon}
          </div>

          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
              {config.label}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {config.description}
            </p>

            {/* 时间信息 */}
            {stage.startTime && (
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>开始: {new Date(stage.startTime).toLocaleTimeString('zh-CN')}</span>
                {stage.endTime && (
                  <>
                    <span>结束: {new Date(stage.endTime).toLocaleTimeString('zh-CN')}</span>
                    {duration && <span>耗时: {duration}秒</span>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 状态图标 */}
        <div
          className={`
            text-${statusConfig.color}-500
          `}
        >
          {statusConfig.icon}
        </div>
      </div>

      {/* 消息 */}
      {stage.message && (
        <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
          {stage.message}
        </div>
      )}

      {/* 进度条 */}
      {stage.status === 'in_progress' && stage.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>进度</span>
            <span>{stage.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${config.color}-500 transition-all duration-500`}
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {stage.error && stage.status === 'failed' && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{stage.error}</span>
          </div>
        </div>
      )}

      {/* 日志 */}
      {stage.logs && stage.logs.length > 0 && (
        <div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <Terminal className="w-4 h-4" />
            <span>查看日志 ({stage.logs.length}条)</span>
          </button>

          {showLogs && (
            <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="font-mono text-xs text-green-400 space-y-1">
                {stage.logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 部署进度主组件
 */
export const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  deploymentId,
  stages,
  currentStage,
  onRetry,
  onCancel,
  className = '',
}) => {
  const overallProgress = Math.round(
    (stages.reduce((sum, stage) => {
      if (stage.status === 'completed') return sum + 100;
      if (stage.status === 'in_progress') return sum + (stage.progress || 0);
      return sum;
    }, 0) /
      (stages.length * 100)) *
      100
  );

  const hasFailure = stages.some((stage) => stage.status === 'failed');
  const allCompleted = stages.every((stage) => stage.status === 'completed');
  const inProgress = stages.some((stage) => stage.status === 'in_progress');

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 标题和总体状态 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            部署进度
          </h3>
          <div
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${
                allCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : hasFailure
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : inProgress
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
            `}
          >
            {allCompleted && '✅ 部署成功'}
            {hasFailure && '❌ 部署失败'}
            {!allCompleted && !hasFailure && inProgress && '⏳ 部署中...'}
            {!allCompleted && !hasFailure && !inProgress && '⏸️ 等待中'}
          </div>
        </div>

        {/* 部署ID */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          部署ID: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{deploymentId}</code>
        </p>
      </div>

      {/* 总体进度 */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <span>总体进度</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`
              h-full transition-all duration-500
              ${
                allCompleted
                  ? 'bg-green-500'
                  : hasFailure
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }
            `}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 阶段列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {stages.map((stage) => (
          <StageCard
            key={stage.stage}
            stage={stage}
            isCurrent={stage.stage === currentStage}
          />
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        {hasFailure && onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     font-medium transition-colors"
          >
            重试部署
          </button>
        )}
        {!allCompleted && onCancel && (
          <button
            onClick={onCancel}
            className={`
              px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
              font-medium transition-colors
              ${hasFailure ? '' : 'flex-1'}
            `}
          >
            取消部署
          </button>
        )}
      </div>
    </div>
  );
};

export default DeploymentProgress;
