/**
 * AgentListView
 *
 * Agent 列表视图组件（默认视图）
 * 以列表形式展示所有 Agent 的状态卡片
 */

import React, { useState, useMemo } from 'react';
import type { BuildSession, AgentWorkStatus, AgentPersona } from '../../types/visualization.types';
import AgentStatusCard from './AgentStatusCard';

export interface AgentListViewProps {
  session: BuildSession;
  statuses: AgentWorkStatus[];
  personas?: AgentPersona[];
  className?: string;
}

export const AgentListView: React.FC<AgentListViewProps> = ({
  session,
  statuses,
  personas = [],
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // 创建 persona 映射
  const personaMap = useMemo(() => {
    const map = new Map<string, AgentPersona>();
    personas.forEach(persona => {
      map.set(persona.agentType, persona);
    });
    return map;
  }, [personas]);

  // 过滤和排序状态
  const filteredStatuses = useMemo(() => {
    let filtered = statuses;

    // 应用过滤器
    switch (filter) {
      case 'active':
        filtered = statuses.filter(s => s.status === 'in_progress' || s.status === 'retrying');
        break;
      case 'completed':
        filtered = statuses.filter(s => s.status === 'completed');
        break;
      case 'failed':
        filtered = statuses.filter(s => s.status === 'failed');
        break;
      case 'all':
      default:
        // 显示所有
        break;
    }

    // 排序：active > retrying > failed > in_progress > completed > pending > skipped
    const statusPriority: Record<string, number> = {
      'in_progress': 5,
      'retrying': 6,
      'failed': 4,
      'pending': 2,
      'completed': 3,
      'skipped': 1,
    };

    return filtered.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 0;
      const priorityB = statusPriority[b.status] || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 降序
      }
      // 相同优先级按更新时间排序
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [statuses, filter]);

  // 切换卡片展开状态
  const toggleCardExpand = (statusId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statusId)) {
        newSet.delete(statusId);
      } else {
        newSet.add(statusId);
      }
      return newSet;
    });
  };

  // 统计数量
  const counts = useMemo(() => {
    return {
      all: statuses.length,
      active: statuses.filter(s => s.status === 'in_progress' || s.status === 'retrying').length,
      completed: statuses.filter(s => s.status === 'completed').length,
      failed: statuses.filter(s => s.status === 'failed').length,
    };
  }, [statuses]);

  return (
    <div className={`agent-list-view ${className}`}>
      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6 border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          全部 ({counts.all})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          进行中 ({counts.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          已完成 ({counts.completed})
        </button>
        {counts.failed > 0 && (
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === 'failed'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            失败 ({counts.failed})
          </button>
        )}
      </div>

      {/* Agent Cards Grid */}
      {filteredStatuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">没有匹配的 Agent</p>
          <p className="text-sm mt-2">尝试切换其他筛选条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStatuses.map((status) => (
            <div
              key={status.statusId}
              onClick={() => toggleCardExpand(status.statusId)}
              className="cursor-pointer"
            >
              <AgentStatusCard
                status={status}
                persona={personaMap.get(status.agentType)}
                showDetails={expandedCards.has(status.statusId)}
                className="agent-card-enter"
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State for New Session */}
      {statuses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
          <svg className="w-20 h-20 mb-4 text-text-disabled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-xl font-medium mb-2">等待 Agent 启动</p>
          <p className="text-sm">构建会话已创建，Agent 即将开始工作...</p>
        </div>
      )}

      {/* Legend (for first-time users) */}
      {statuses.length > 0 && (
        <div className="mt-8 p-4 bg-surface-elevated rounded-lg border border-border">
          <p className="text-sm font-semibold text-text-secondary mb-3">提示</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-text-tertiary">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-in-progress mr-2"></div>
              <span>进行中 - Agent 正在工作</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-completed mr-2"></div>
              <span>已完成 - 任务成功完成</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-failed mr-2"></div>
              <span>失败 - 任务执行失败</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-retrying mr-2"></div>
              <span>重试中 - 正在重试失败任务</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-pending mr-2"></div>
              <span>等待中 - 等待开始</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-agent-skipped mr-2"></div>
              <span>已跳过 - 条件不满足</span>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            💡 点击任意卡片可展开查看详细信息
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentListView;
