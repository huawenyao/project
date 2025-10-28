/**
 * DecisionModal
 *
 * 决策详情弹窗组件 - 显示完整决策推理、备选方案和权衡
 */

import React, { useEffect } from 'react';
import type { DecisionRecord } from '../../types/visualization.types';

export interface DecisionModalProps {
  decision: DecisionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (decisionId: string) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  decision,
  isOpen,
  onClose,
  onMarkAsRead,
}) => {
  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !decision) return null;

  const getImportanceBadge = () => {
    const badges = {
      critical: { label: '关键决策', color: 'bg-error text-text-on-primary', icon: '⚠️' },
      high: { label: '重要决策', color: 'bg-warning text-text-on-accent', icon: '❗' },
      medium: { label: '中等决策', color: 'bg-info text-text-on-primary', icon: 'ℹ️' },
      low: { label: '一般决策', color: 'bg-agent-pending text-text-primary', icon: '💡' },
    };
    const badge = badges[decision.importance] || badges.low;
    return (
      <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${badge.color}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-modal-backdrop backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4 animate-scale-in">
        <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-surface-elevated">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getImportanceBadge()}
                  <span className="px-2 py-1 text-xs bg-surface-hover text-text-secondary rounded">
                    {decision.agentType}
                  </span>
                  {!decision.isRead && (
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs text-primary font-semibold">未读</span>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{decision.decisionTitle}</h2>
                <p className="text-sm text-text-tertiary mt-1">
                  {new Date(decision.timestamp).toLocaleString('zh-CN')}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="ml-4 p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* 决策内容 */}
            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                决策内容
              </h3>
              <p className="text-text-secondary leading-relaxed">{decision.decisionContent}</p>
            </section>

            {/* 决策理由 */}
            <section className="p-5 bg-surface-elevated border border-border rounded-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                决策理由
              </h3>
              <p className="text-text-secondary leading-relaxed">{decision.reasoning}</p>
            </section>

            {/* 备选方案 */}
            {decision.alternatives && decision.alternatives.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  备选方案 ({decision.alternatives.length})
                </h3>
                <div className="space-y-4">
                  {decision.alternatives.map((alt: any, idx: number) => (
                    <div key={idx} className="p-5 bg-surface-elevated border border-border rounded-lg hover:shadow-md transition-shadow">
                      <h4 className="text-base font-semibold text-text-primary mb-3 flex items-center">
                        <span className="w-6 h-6 bg-primary text-text-on-primary rounded-full flex items-center justify-center text-xs font-bold mr-2">
                          {idx + 1}
                        </span>
                        {alt.option}
                      </h4>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* 优点 */}
                        {alt.pros && alt.pros.length > 0 && (
                          <div className="p-3 bg-success-bg border border-success-border rounded">
                            <p className="text-xs font-semibold text-success uppercase mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              优点
                            </p>
                            <ul className="space-y-2">
                              {alt.pros.map((pro: string, i: number) => (
                                <li key={i} className="text-sm text-text-secondary flex items-start">
                                  <span className="text-success mr-2 mt-0.5">✓</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 缺点 */}
                        {alt.cons && alt.cons.length > 0 && (
                          <div className="p-3 bg-error-bg border border-error-border rounded">
                            <p className="text-xs font-semibold text-error uppercase mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              缺点
                            </p>
                            <ul className="space-y-2">
                              {alt.cons.map((con: string, i: number) => (
                                <li key={i} className="text-sm text-text-secondary flex items-start">
                                  <span className="text-error mr-2 mt-0.5">✗</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 权衡考虑 */}
            {decision.tradeoffs && (
              <section className="p-5 bg-warning-bg border-l-4 border-warning rounded-r-lg">
                <h3 className="text-lg font-semibold text-warning mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  权衡考虑
                </h3>
                <p className="text-text-secondary leading-relaxed">{decision.tradeoffs}</p>
              </section>
            )}

            {/* 影响分析 */}
            {decision.impact && (
              <section className="p-5 bg-info-bg border-l-4 border-info rounded-r-lg">
                <h3 className="text-lg font-semibold text-info mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  影响分析
                </h3>
                <p className="text-text-secondary leading-relaxed">{decision.impact}</p>
              </section>
            )}

            {/* 标签 */}
            {decision.tags && decision.tags.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-text-tertiary mb-2">相关标签</h3>
                <div className="flex flex-wrap gap-2">
                  {decision.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 text-sm bg-surface-elevated text-text-secondary rounded-full border border-border">
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-surface-elevated flex items-center justify-between">
            <div className="text-xs text-text-tertiary">
              决策 ID: {decision.decisionId.slice(0, 8)}...
            </div>
            <div className="flex space-x-3">
              {!decision.isRead && onMarkAsRead && (
                <button
                  onClick={() => {
                    onMarkAsRead(decision.decisionId);
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark hover:bg-primary-light hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  标记已读
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium bg-primary text-text-on-primary hover:bg-primary-dark rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DecisionModal;
