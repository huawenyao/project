/**
 * DecisionSidebar
 *
 * 决策侧边栏组件 - 显示决策时间线
 */

import React, { useState } from 'react';
import { useDecisions } from '../../hooks/useDecisions';
import DecisionTimeline from './DecisionTimeline';
import type { DecisionImportance } from '../../types/visualization.types';

export interface DecisionSidebarProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onDecisionClick?: (decisionId: string) => void;
}

export const DecisionSidebar: React.FC<DecisionSidebarProps> = ({
  sessionId,
  isOpen,
  onClose,
  onDecisionClick,
}) => {
  const {
    filteredDecisions,
    unreadCount,
    markAsRead,
    markAllAsRead,
    setImportanceFilter,
    importanceFilter,
  } = useDecisions(sessionId);

  const [searchQuery, setSearchQuery] = useState('');

  // 本地搜索过滤
  const displayDecisions = searchQuery
    ? filteredDecisions.filter(d =>
        d.decisionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.decisionContent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredDecisions;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-modal-backdrop"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-background border-l border-border shadow-xl z-modal transform transition-transform duration-base ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-text-primary">决策记录</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-primary text-text-on-primary rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索决策..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Importance Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setImportanceFilter('all')}
              className={`px-3 py-1 text-xs rounded ${
                importanceFilter === 'all'
                  ? 'bg-primary text-text-on-primary'
                  : 'bg-surface-elevated text-text-secondary'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setImportanceFilter('critical')}
              className={`px-3 py-1 text-xs rounded ${
                importanceFilter === 'critical'
                  ? 'bg-error text-text-on-primary'
                  : 'bg-surface-elevated text-text-secondary'
              }`}
            >
              关键
            </button>
            <button
              onClick={() => setImportanceFilter('high')}
              className={`px-3 py-1 text-xs rounded ${
                importanceFilter === 'high'
                  ? 'bg-warning text-text-on-accent'
                  : 'bg-surface-elevated text-text-secondary'
              }`}
            >
              重要
            </button>
            <button
              onClick={() => setImportanceFilter('medium')}
              className={`px-3 py-1 text-xs rounded ${
                importanceFilter === 'medium'
                  ? 'bg-info text-text-on-primary'
                  : 'bg-surface-elevated text-text-secondary'
              }`}
            >
              中等
            </button>
          </div>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:text-primary-dark"
            >
              标记全部为已读
            </button>
          )}
        </div>

        {/* Decision Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayDecisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>暂无决策记录</p>
            </div>
          ) : (
            <DecisionTimeline
              decisions={displayDecisions}
              onDecisionClick={(decisionId) => {
                markAsRead(decisionId);
                onDecisionClick?.(decisionId);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DecisionSidebar;
