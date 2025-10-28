/**
 * DecisionTimeline
 *
 * 决策时间线组件 - 按时间顺序显示决策记录
 */

import React from 'react';
import type { DecisionRecord } from '../../types/visualization.types';

export interface DecisionTimelineProps {
  decisions: DecisionRecord[];
  onDecisionClick?: (decisionId: string) => void;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  decisions,
  onDecisionClick,
}) => {
  const getImportanceBadge = (importance: string) => {
    const badges = {
      critical: { label: '关键', color: 'bg-error text-text-on-primary' },
      high: { label: '重要', color: 'bg-warning text-text-on-accent' },
      medium: { label: '中等', color: 'bg-info text-text-on-primary' },
      low: { label: '一般', color: 'bg-agent-pending text-text-primary' },
    };
    const badge = badges[importance as keyof typeof badges] || badges.low;
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.color}`}>{badge.label}</span>;
  };

  const getImportanceIcon = (importance: string) => {
    if (importance === 'critical') {
      return (
        <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (importance === 'high') {
      return (
        <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="decision-timeline space-y-4">
      {decisions.map((decision, index) => (
        <div key={decision.decisionId} className="timeline-item relative">
          {/* Timeline Connector */}
          {index < decisions.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
          )}

          {/* Decision Item */}
          <div
            className={`relative flex cursor-pointer transition-all duration-base hover:scale-[1.02] ${
              !decision.isRead ? 'opacity-100' : 'opacity-75'
            }`}
            onClick={() => onDecisionClick?.(decision.decisionId)}
          >
            {/* Timeline Icon */}
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                !decision.isRead ? 'bg-primary-light ring-4 ring-primary-light ring-opacity-20' : 'bg-surface-elevated'
              }`}>
                {getImportanceIcon(decision.importance)}
              </div>
            </div>

            {/* Decision Content Card */}
            <div className={`flex-1 ml-4 p-4 rounded-lg border transition-all ${
              !decision.isRead
                ? 'bg-surface border-primary shadow-sm'
                : 'bg-surface-elevated border-border hover:border-border-hover'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getImportanceBadge(decision.importance)}
                    <span className="text-xs text-text-tertiary">{decision.agentType}</span>
                    {!decision.isRead && (
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs text-primary font-semibold">未读</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary line-clamp-2">
                    {decision.decisionTitle}
                  </h4>
                </div>
                <span className="text-xs text-text-tertiary whitespace-nowrap ml-2">
                  {formatTime(decision.timestamp)}
                </span>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                {decision.decisionContent}
              </p>

              {/* Reasoning Preview */}
              {decision.reasoning && (
                <div className="text-xs text-text-tertiary line-clamp-1 mb-2 flex items-start">
                  <svg className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="truncate">{decision.reasoning}</span>
                </div>
              )}

              {/* Metadata Footer */}
              <div className="flex items-center justify-between text-xs text-text-tertiary pt-2 border-t border-border">
                <div className="flex items-center space-x-3">
                  {decision.alternatives && decision.alternatives.length > 0 && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {decision.alternatives.length} 备选方案
                    </span>
                  )}
                  {decision.impact && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      有影响分析
                    </span>
                  )}
                </div>
                <span className="text-primary hover:text-primary-dark flex items-center">
                  查看详情
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>

              {/* Tags */}
              {decision.tags && decision.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {decision.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-xs bg-surface-hover text-text-tertiary rounded">
                      #{tag}
                    </span>
                  ))}
                  {decision.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-text-tertiary">
                      +{decision.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DecisionTimeline;
