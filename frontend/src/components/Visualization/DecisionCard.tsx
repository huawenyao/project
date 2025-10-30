/**
 * DecisionCard
 *
 * 决策卡片组件 - 显示完整决策详情
 * T092-T094: Integrated preview display with click-to-expand
 */

import React, { useState } from 'react';
import type { DecisionRecord } from '../../types/visualization.types';
import { PreviewModal, PreviewData } from './PreviewModal';

export interface DecisionCardProps {
  decision: DecisionRecord & { preview?: PreviewData };
  onMarkAsRead?: (decisionId: string) => void;
  className?: string;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onMarkAsRead,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getImportanceBadge = () => {
    const badges = {
      critical: { label: '关键', color: 'bg-error text-text-on-primary' },
      high: { label: '重要', color: 'bg-warning text-text-on-accent' },
      medium: { label: '中等', color: 'bg-info text-text-on-primary' },
      low: { label: '一般', color: 'bg-agent-pending text-text-primary' },
    };
    const badge = badges[decision.importance] || badges.low;
    return <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.color}`}>{badge.label}</span>;
  };

  return (
    <div className={`decision-card card ${!decision.isRead ? 'border-l-4 border-primary' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getImportanceBadge()}
            <span className="text-xs text-text-tertiary">{decision.agentType}</span>
            {!decision.isRead && (
              <span className="px-2 py-0.5 text-xs bg-primary-50 text-primary rounded-full">未读</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-text-primary">{decision.decisionTitle}</h3>
        </div>
        {!decision.isRead && onMarkAsRead && (
          <button
            onClick={() => onMarkAsRead(decision.decisionId)}
            className="text-sm text-primary hover:text-primary-dark"
          >
            标记已读
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-text-secondary mb-3">{decision.decisionContent}</p>

      {/* Reasoning */}
      <div className="mb-3 p-3 bg-surface-elevated rounded-lg">
        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          决策理由
        </h4>
        <p className="text-sm text-text-secondary">{decision.reasoning?.reasoning || decision.reasoning as any as string}</p>
      </div>

      {/* Alternatives (Expandable) */}
      {decision.alternatives && decision.alternatives.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm font-semibold text-primary hover:text-primary-dark"
          >
            <svg className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            备选方案 ({decision.alternatives.length})
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-3">
              {decision.alternatives.map((alt: any, idx: number) => (
                <div key={idx} className="p-3 bg-surface-hover rounded-lg border border-border">
                  <h5 className="font-semibold text-text-primary mb-2">{alt.option}</h5>
                  {alt.pros && alt.pros.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-success mb-1">优点:</p>
                      <ul className="text-sm text-text-secondary space-y-1">
                        {alt.pros.map((pro: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-success mr-2">✓</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {alt.cons && alt.cons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-error mb-1">缺点:</p>
                      <ul className="text-sm text-text-secondary space-y-1">
                        {alt.cons.map((con: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-error mr-2">✗</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tradeoffs */}
      {decision.tradeoffs && (
        <div className="mb-3 p-3 bg-warning-bg border border-warning-border rounded-lg">
          <h4 className="text-sm font-semibold text-warning mb-2">权衡考虑</h4>
          <p className="text-sm text-text-secondary">{decision.tradeoffs}</p>
        </div>
      )}

      {/* Impact */}
      {decision.impact && (
        <div className="mb-3 p-3 bg-info-bg border border-info-border rounded-lg">
          <h4 className="text-sm font-semibold text-info mb-2">影响分析</h4>
          <p className="text-sm text-text-secondary">{decision.impact}</p>
        </div>
      )}

      {/* Tags */}
      {decision.tags && decision.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {decision.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-surface-elevated text-text-secondary rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Preview Section (T092: Integrate preview display) */}
      {decision.preview && (
        <div className="mb-3 p-4 bg-gradient-to-r from-primary-light/10 to-primary-light/5 border border-primary-light rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-semibold text-primary">预览可用</span>
                <span className="px-2 py-0.5 text-xs bg-primary text-text-on-primary rounded-full">
                  {decision.preview.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {decision.preview.description || '点击查看预览详情'}
              </p>
            </div>

            {/* Preview Thumbnail or Icon (T093: Click-to-expand) */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="ml-4 group relative"
            >
              {decision.preview.type === 'image' ? (
                <div className="w-24 h-24 rounded overflow-hidden border-2 border-primary group-hover:border-primary-dark transition-colors">
                  <img
                    src={decision.preview.content}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded bg-primary-light/20 border-2 border-primary group-hover:border-primary-dark flex items-center justify-center transition-colors">
                  <svg className="w-10 h-10 text-primary group-hover:text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all">
                <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-sm">
                  点击查看
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-border">
        <span>{new Date(decision.timestamp).toLocaleString('zh-CN')}</span>
        {decision.preview && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-1 text-primary hover:text-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>查看预览</span>
          </button>
        )}
      </div>

      {/* Preview Modal (T094: Preview type detection and rendering) */}
      {decision.preview && (
        <PreviewModal
          preview={decision.preview}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default DecisionCard;
