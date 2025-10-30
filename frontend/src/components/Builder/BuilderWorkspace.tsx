/**
 * Builder 中央工作区
 * 包含 Agent 状态网格、进度摘要和错误卡片
 */

import React from 'react';
import AgentStatusGrid from './AgentStatusGrid';
import ProgressSummary from '../Visualization/ProgressSummary';
import ErrorCard from '../Visualization/ErrorCard';
import { useBuilderStore } from '../../stores/builderStore';

export default function BuilderWorkspace() {
  const { agents, errors, currentSessionId, sessionStatus } = useBuilderStore();

  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Agent 状态网格 */}
      <div>
        <AgentStatusGrid
          agents={agents}
          onAgentClick={(agent) => {
            console.log('Agent clicked:', agent);
            // TODO: 打开 Agent 详情 Modal
          }}
        />
      </div>

      {/* 整体进度摘要 */}
      {currentSessionId && sessionStatus !== 'idle' && (
        <div>
          <ProgressSummary sessionId={currentSessionId} />
        </div>
      )}

      {/* 错误卡片 */}
      {errors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⚠️ 错误与警告
          </h3>
          {errors.map((error) => (
            <ErrorCard
              key={error.errorId}
              error={error}
              onRetry={() => {
                console.log('重试:', error.errorId);
                // TODO: 实现重试逻辑
              }}
              onSkip={() => {
                console.log('跳过:', error.errorId);
                // TODO: 实现跳过逻辑
                useBuilderStore.getState().removeError(error.errorId);
              }}
              onAbort={() => {
                console.log('终止:', error.errorId);
                // TODO: 实现终止逻辑
              }}
            />
          ))}
        </div>
      )}

      {/* 空状态提示 */}
      {sessionStatus === 'idle' && agents.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              准备好开始构建了吗？
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              在左侧输入你的项目需求，选择技术栈，然后点击"开始构建"按钮。
              我们的 AI Agents 会自动为你创建应用。
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  快速高效
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  通常 10-15 分钟完成整个应用构建
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  实时可见
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  实时查看每个 Agent 的工作进度
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
