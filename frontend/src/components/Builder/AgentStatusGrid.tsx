/**
 * Agent 状态网格组件
 * 以网格形式展示所有 Agent 的实时工作状态
 */

import React from 'react';
import AgentStatusCard from '../Visualization/AgentStatusCard';
import type { AgentWorkStatus } from '../../types/visualization';

interface AgentStatusGridProps {
  agents: AgentWorkStatus[];
  onAgentClick?: (agent: AgentWorkStatus) => void;
}

export default function AgentStatusGrid({ agents, onAgentClick }: AgentStatusGridProps) {
  // 如果没有 agents，显示空状态
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            等待启动构建
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            点击"开始构建"按钮，AI Agents 会开始工作
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <div
          key={agent.agentId}
          onClick={() => onAgentClick?.(agent)}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <AgentStatusCard status={agent} />
        </div>
      ))}
    </div>
  );
}
