/**
 * Builder 底部协作面板
 * 可折叠的 Agent 协作关系图和列表视图
 */

import React from 'react';
import { ChevronUp, ChevronDown, List, GitBranch } from 'lucide-react';
import AgentDependencyGraph from '../Visualization/AgentDependencyGraph';
import AgentListView from '../Visualization/AgentListView';
import { useBuilderStore } from '../../stores/builderStore';

interface CollaborationPanelProps {
  sessionId: string | null;
}

export default function CollaborationPanel({ sessionId }: CollaborationPanelProps) {
  const { collaborationPanelExpanded, toggleCollaborationPanel, viewMode, toggleViewMode } =
    useBuilderStore();

  if (!sessionId) {
    return null;
  }

  const panelHeight = collaborationPanelExpanded ? 'h-80' : 'h-12';

  return (
    <div className={'border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ' + panelHeight}>
      {/* 折叠/展开头部 */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={toggleCollaborationPanel}
      >
        <div className="flex items-center space-x-3">
          <GitBranch className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Agent 协作关系图
          </h3>
        </div>

        <div className="flex items-center space-x-4">
          {collaborationPanelExpanded && (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleViewMode();
                }}
                className={'px-3 py-1 text-xs font-medium rounded-lg transition-colors ' + (viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
              >
                <List className="w-4 h-4 inline mr-1" />
                列表视图
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleViewMode();
                }}
                className={'px-3 py-1 text-xs font-medium rounded-lg transition-colors ' + (viewMode === 'graph'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
              >
                <GitBranch className="w-4 h-4 inline mr-1" />
                图形视图
              </button>
            </div>
          )}

          {collaborationPanelExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {collaborationPanelExpanded && (
        <div className="h-[calc(100%-48px)] p-6 overflow-auto">
          {viewMode === 'graph' ? (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
              <AgentDependencyGraph sessionId={sessionId} />
            </div>
          ) : (
            <div className="h-full">
              <AgentListView sessionId={sessionId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
