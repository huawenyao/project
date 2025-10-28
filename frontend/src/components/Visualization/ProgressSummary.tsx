/**
 * ProgressSummary
 *
 * 整体进度摘要组件
 * 显示所有 Agent 的总体进度和统计信息
 */

import React, { useMemo } from 'react';
import type { BuildSession, AgentWorkStatus } from '../../types/visualization.types';
import ProgressBar from '../UI/ProgressBar';

export interface ProgressSummaryProps {
  session: BuildSession;
  statuses: AgentWorkStatus[];
  overallProgress: number;
  className?: string;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  session,
  statuses,
  overallProgress,
  className = '',
}) => {
  // 计算统计信息
  const stats = useMemo(() => {
    const total = statuses.length;
    const completed = statuses.filter(s => s.status === 'completed').length;
    const inProgress = statuses.filter(s => s.status === 'in_progress' || s.status === 'retrying').length;
    const failed = statuses.filter(s => s.status === 'failed').length;
    const pending = statuses.filter(s => s.status === 'pending').length;
    const skipped = statuses.filter(s => s.status === 'skipped').length;

    return {
      total,
      completed,
      inProgress,
      failed,
      pending,
      skipped,
    };
  }, [statuses]);

  // 计算总耗时
  const getTotalDuration = () => {
    if (!session.startTime) return null;
    const start = new Date(session.startTime).getTime();
    const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);

    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}小时${minutes}分`;
  };

  // 获取状态文本
  const getStatusText = () => {
    if (session.status === 'success') return '构建成功';
    if (session.status === 'failed') return '构建失败';
    if (session.status === 'partial_success') return '部分成功';
    if (stats.inProgress > 0) return `${stats.inProgress} 个 Agent 工作中`;
    return '准备中';
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (session.status === 'success') return 'text-success';
    if (session.status === 'failed') return 'text-error';
    if (session.status === 'partial_success') return 'text-warning';
    if (stats.inProgress > 0) return 'text-primary';
    return 'text-text-tertiary';
  };

  return (
    <div className={`progress-summary card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">整体进度</h3>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-secondary">总体完成度</span>
          <span className="text-xl font-bold text-primary">{overallProgress}%</span>
        </div>
        <ProgressBar
          progress={overallProgress}
          status={session.status === 'in_progress' ? 'in_progress' : session.status === 'failed' ? 'failed' : 'completed'}
          showGlow={session.status === 'in_progress'}
          height="h-3"
        />
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        {/* Total */}
        <div className="stat-item text-center p-3 bg-surface-elevated rounded-lg">
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-xs text-text-tertiary mt-1">总计</div>
        </div>

        {/* Completed */}
        <div className="stat-item text-center p-3 bg-success-bg rounded-lg border border-success-border">
          <div className="text-2xl font-bold text-success">{stats.completed}</div>
          <div className="text-xs text-text-tertiary mt-1">已完成</div>
        </div>

        {/* In Progress */}
        {stats.inProgress > 0 && (
          <div className="stat-item text-center p-3 bg-primary-50 rounded-lg border border-primary">
            <div className="text-2xl font-bold text-primary animate-pulse">{stats.inProgress}</div>
            <div className="text-xs text-text-tertiary mt-1">进行中</div>
          </div>
        )}

        {/* Failed */}
        {stats.failed > 0 && (
          <div className="stat-item text-center p-3 bg-error-bg rounded-lg border border-error-border">
            <div className="text-2xl font-bold text-error">{stats.failed}</div>
            <div className="text-xs text-text-tertiary mt-1">失败</div>
          </div>
        )}

        {/* Pending */}
        {stats.pending > 0 && (
          <div className="stat-item text-center p-3 bg-surface-hover rounded-lg border border-border">
            <div className="text-2xl font-bold text-text-secondary">{stats.pending}</div>
            <div className="text-xs text-text-tertiary mt-1">等待中</div>
          </div>
        )}

        {/* Skipped */}
        {stats.skipped > 0 && (
          <div className="stat-item text-center p-3 bg-surface-hover rounded-lg border border-border">
            <div className="text-2xl font-bold text-text-tertiary">{stats.skipped}</div>
            <div className="text-xs text-text-tertiary mt-1">已跳过</div>
          </div>
        )}
      </div>

      {/* Time and Additional Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-6 text-text-tertiary">
          {/* Duration */}
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>耗时: {getTotalDuration()}</span>
          </div>

          {/* Agent List */}
          {session.agentList && session.agentList.length > 0 && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{session.agentList.length} 个 Agent 参与</span>
            </div>
          )}
        </div>

        {/* Success Rate */}
        {stats.total > 0 && session.status !== 'in_progress' && (
          <div className="text-text-secondary">
            <span>成功率: </span>
            <span className={`font-semibold ${stats.failed === 0 ? 'text-success' : stats.failed > stats.completed ? 'text-error' : 'text-warning'}`}>
              {Math.round((stats.completed / stats.total) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Warning for failed agents */}
      {stats.failed > 0 && (
        <div className="mt-4 p-3 bg-warning-bg border border-warning-border rounded-lg flex items-start">
          <svg className="w-5 h-5 text-warning flex-shrink-0 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning">有 {stats.failed} 个 Agent 执行失败</p>
            <p className="text-xs text-text-tertiary mt-1">请查看下方详情了解失败原因</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressSummary;
