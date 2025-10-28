/**
 * VisualizationPanel
 *
 * 可视化系统的主容器组件
 * 集成 WebSocket 实时更新，管理整体可视化状态
 */

import React, { useEffect, useState } from 'react';
import { useVisualization } from '../../hooks/useVisualization';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useTheme } from '../../hooks/useTheme';
import AgentListView from './AgentListView';
import ProgressSummary from './ProgressSummary';
import type { BuildSession } from '../../types/visualization.types';

export interface VisualizationPanelProps {
  sessionId: string;
  className?: string;
  showProgressSummary?: boolean;
  autoRefresh?: boolean;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  sessionId,
  className = '',
  showProgressSummary = true,
  autoRefresh = true,
}) => {
  const { mode } = useTheme();
  const {
    session,
    loadSession,
    isLoading: sessionLoading,
    error: sessionError,
  } = useVisualization(sessionId);

  const {
    statuses,
    activeAgents,
    progress,
    personas,
    isLoading: statusLoading,
  } = useAgentStatus(sessionId);

  const [isConnected, setIsConnected] = useState(false);

  // 加载会话数据
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // 处理加载状态
  if (sessionLoading || statusLoading) {
    return (
      <div className={`visualization-panel loading ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-4 text-text-secondary">正在加载可视化数据...</span>
        </div>
      </div>
    );
  }

  // 处理错误状态
  if (sessionError) {
    return (
      <div className={`visualization-panel error ${className}`}>
        <div className="bg-error-bg border border-error-border rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-error mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-error">加载失败</h3>
              <p className="text-text-secondary mt-1">{sessionError}</p>
            </div>
          </div>
          <button
            onClick={() => loadSession(sessionId)}
            className="mt-4 btn btn-secondary"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (!session) {
    return (
      <div className={`visualization-panel empty ${className}`}>
        <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">未找到会话数据</p>
          <p className="text-sm mt-2">会话ID: {sessionId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`visualization-panel ${mode} ${className}`}>
      {/* Header with connection status */}
      <div className="panel-header flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-text-primary">
            AI 思考过程可视化
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
            <span className="text-sm text-text-secondary">
              {isConnected ? '实时连接' : '连接断开'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Session status badge */}
          <span className={`badge badge-${session.status === 'success' ? 'success' : session.status === 'failed' ? 'error' : 'primary'}`}>
            {session.status === 'in_progress' ? '进行中' :
             session.status === 'success' ? '已完成' :
             session.status === 'failed' ? '失败' : '部分成功'}
          </span>

          {/* Active agents count */}
          {activeAgents && activeAgents.length > 0 && (
            <span className="text-sm text-text-secondary">
              {activeAgents.length} 个Agent工作中
            </span>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      {showProgressSummary && (
        <div className="p-4 border-b border-border">
          <ProgressSummary
            session={session}
            statuses={statuses}
            overallProgress={progress}
          />
        </div>
      )}

      {/* Agent List View */}
      <div className="p-4">
        <AgentListView
          session={session}
          statuses={statuses}
          personas={personas}
        />
      </div>

      {/* Footer with session info */}
      <div className="panel-footer p-4 border-t border-border text-sm text-text-tertiary">
        <div className="flex items-center justify-between">
          <div>
            <span>会话ID: </span>
            <code className="px-2 py-1 bg-surface-elevated rounded text-xs">
              {session.sessionId}
            </code>
          </div>
          <div>
            <span>开始时间: </span>
            <span>{new Date(session.startTime).toLocaleString('zh-CN')}</span>
            {session.endTime && (
              <>
                <span className="mx-2">|</span>
                <span>结束时间: </span>
                <span>{new Date(session.endTime).toLocaleString('zh-CN')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
