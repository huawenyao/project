/**
 * DecisionToast
 *
 * 决策Toast通知组件（用于高重要性决策）
 * 使用react-hot-toast显示
 */

import React from 'react';
import toast from 'react-hot-toast';
import type { DecisionRecord } from '../../types/visualization.types';

export interface DecisionToastProps {
  decision: DecisionRecord;
  onView?: (decisionId: string) => void;
  onDismiss?: (decisionId: string) => void;
}

export const showDecisionToast = (
  decision: DecisionRecord,
  onView?: (decisionId: string) => void,
  onDismiss?: (decisionId: string) => void
) => {
  const getImportanceColor = () => {
    switch (decision.importance) {
      case 'critical':
        return 'bg-error border-error-border text-error-light';
      case 'high':
        return 'bg-warning border-warning-border text-warning-light';
      default:
        return 'bg-info border-info-border text-info-light';
    }
  };

  const getImportanceIcon = () => {
    if (decision.importance === 'critical') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in-right' : 'animate-fade-out'
        } max-w-md w-full bg-surface border-2 ${getImportanceColor()} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {getImportanceIcon()}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {decision.agentType} 做出了决策
              </p>
              <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                {decision.decisionTitle}
              </p>
              {decision.impact && (
                <p className="mt-1 text-xs text-text-tertiary line-clamp-1">
                  影响: {decision.impact}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-border">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onView?.(decision.decisionId);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-dark focus:outline-none"
          >
            查看
          </button>
        </div>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onDismiss?.(decision.decisionId);
          }}
          className="absolute top-2 right-2 text-text-tertiary hover:text-text-secondary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    {
      duration: 5000, // 5秒自动关闭
      position: 'top-right',
    }
  );
};

export default showDecisionToast;
