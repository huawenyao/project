/**
 * AgentStatusCard
 *
 * 单个 Agent 的状态卡片组件
 * 显示进度条、当前操作、状态等信息
 */

import React from 'react';
import type { AgentWorkStatus, AgentPersona } from '../../types/visualization.types';
import ProgressBar from '../UI/ProgressBar';
import StatusBadge from '../UI/StatusBadge';

export interface AgentStatusCardProps {
  status: AgentWorkStatus;
  persona?: AgentPersona;
  className?: string;
  showDetails?: boolean;
}

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  status,
  persona,
  className = '',
  showDetails = false,
}) => {
  // 获取状态对应的样式
  const getStatusClass = () => {
    switch (status.status) {
      case 'in_progress':
      case 'retrying':
        return 'border-agent-in-progress bg-primary-50';
      case 'completed':
        return 'border-agent-completed bg-success-bg';
      case 'failed':
        return 'border-agent-failed bg-error-bg';
      case 'pending':
        return 'border-agent-pending bg-surface';
      case 'skipped':
        return 'border-agent-skipped bg-surface-hover';
      default:
        return 'border-border bg-surface';
    }
  };

  // 获取状态对应的图标
  const getStatusIcon = () => {
    switch (status.status) {
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-agent-in-progress animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5 text-agent-completed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-agent-failed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'retrying':
        return (
          <svg className="w-5 h-5 text-agent-retrying animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-agent-pending" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'skipped':
        return (
          <svg className="w-5 h-5 text-agent-skipped" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // 计算已用时间
  const getElapsedTime = () => {
    if (!status.startTime) return null;
    const start = new Date(status.startTime).getTime();
    const end = status.endTime ? new Date(status.endTime).getTime() : Date.now();
    const elapsed = Math.floor((end - start) / 1000);

    if (elapsed < 60) return `${elapsed}秒`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}分钟`;
    return `${Math.floor(elapsed / 3600)}小时`;
  };

  // 格式化预估剩余时间
  const formatEstimatedTime = (seconds?: number | null) => {
    if (!seconds) return null;
    if (seconds < 60) return `约${seconds}秒`;
    if (seconds < 3600) return `约${Math.floor(seconds / 60)}分钟`;
    return `约${Math.floor(seconds / 3600)}小时`;
  };

  return (
    <div
      className={`agent-status-card card border-l-4 ${getStatusClass()} ${className} transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Agent Icon/Avatar */}
          {persona?.avatarUrl ? (
            <img
              src={persona.avatarUrl}
              alt={persona.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary text-text-on-primary flex items-center justify-center font-semibold">
              {status.agentType.substring(0, 2).toUpperCase()}
            </div>
          )}

          {/* Agent Name and Type */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {persona?.displayName || status.agentType}
            </h3>
            {persona?.role && (
              <p className="text-sm text-text-tertiary">{persona.role}</p>
            )}
          </div>
        </div>

        {/* Status Icon */}
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <StatusBadge status={status.status} />
        </div>
      </div>

      {/* Task Description */}
      <p className="text-text-secondary mb-3 line-clamp-2">
        {status.taskDescription}
      </p>

      {/* Current Operation */}
      {status.currentOperation && (
        <div className="text-sm text-text-tertiary mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="truncate">{status.currentOperation}</span>
        </div>
      )}

      {/* Progress Bar */}
      {status.status !== 'skipped' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-tertiary">进度</span>
            <span className="font-semibold text-text-primary">{status.progressPercentage}%</span>
          </div>
          <ProgressBar
            progress={status.progressPercentage}
            status={status.status}
            showGlow={status.status === 'in_progress'}
          />
        </div>
      )}

      {/* Time Information */}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <div className="flex items-center space-x-4">
          {status.startTime && (
            <span>已用时: {getElapsedTime()}</span>
          )}
          {status.estimatedTimeRemaining && status.status === 'in_progress' && (
            <span>剩余: {formatEstimatedTime(status.estimatedTimeRemaining)}</span>
          )}
        </div>

        {/* Retry Information */}
        {status.retryCount > 0 && (
          <span className="text-agent-retrying">
            重试 {status.retryCount}/{status.maxRetry}
          </span>
        )}
      </div>

      {/* Details Section (Expandable) */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border">
          {/* Error Message */}
          {status.errorMessage && (
            <div className="mb-3 p-3 bg-error-bg border border-error-border rounded text-sm">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-error mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-error mb-1">错误信息</p>
                  <p className="text-text-secondary">{status.errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Summary */}
          {status.resultSummary && status.status === 'completed' && (
            <div className="p-3 bg-success-bg border border-success-border rounded text-sm">
              <p className="font-semibold text-success mb-1">执行结果</p>
              <p className="text-text-secondary">{status.resultSummary}</p>
            </div>
          )}

          {/* Persona Description */}
          {persona?.description && (
            <div className="mt-3 text-sm text-text-tertiary">
              <p className="font-semibold mb-1">专业领域</p>
              <p>{persona.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentStatusCard;
