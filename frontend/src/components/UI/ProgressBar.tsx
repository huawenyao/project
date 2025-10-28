/**
 * ProgressBar
 *
 * 进度条 UI 组件
 * 支持不同状态的颜色、发光效果、动画
 */

import React from 'react';
import type { AgentStatus } from '../../types/visualization.types';

export interface ProgressBarProps {
  progress: number; // 0-100
  status?: AgentStatus;
  showGlow?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'in_progress',
  showGlow = false,
  showPercentage = false,
  animated = true,
  height = 'h-2',
  className = '',
}) => {
  // 确保进度在 0-100 之间
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // 根据状态获取颜色
  const getBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-agent-completed';
      case 'failed':
        return 'bg-agent-failed';
      case 'retrying':
        return 'bg-agent-retrying';
      case 'in_progress':
        return 'bg-agent-in-progress';
      case 'pending':
        return 'bg-agent-pending';
      case 'skipped':
        return 'bg-agent-skipped';
      default:
        return 'bg-primary';
    }
  };

  // 根据状态获取发光效果
  const getGlowClass = () => {
    if (!showGlow) return '';

    switch (status) {
      case 'in_progress':
        return 'shadow-glow';
      case 'retrying':
        return 'shadow-glow-secondary';
      case 'completed':
        return 'shadow-glow-accent';
      default:
        return '';
    }
  };

  return (
    <div className={`progress-bar-container relative ${className}`}>
      {/* Background Track */}
      <div className={`progress-bar-track ${height} bg-surface-elevated rounded-full overflow-hidden`}>
        {/* Progress Fill */}
        <div
          className={`progress-bar-fill ${height} ${getBarColor()} ${getGlowClass()} ${
            animated ? 'transition-all duration-slow ease-out' : ''
          } rounded-full relative`}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Shimmer Effect for Active Progress */}
          {status === 'in_progress' && clampedProgress > 0 && clampedProgress < 100 && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          )}

          {/* Indeterminate Animation for 0% Progress */}
          {status === 'in_progress' && clampedProgress === 0 && (
            <div className="absolute inset-0 bg-agent-in-progress animate-progress-indeterminate"></div>
          )}
        </div>
      </div>

      {/* Percentage Label (Optional) */}
      {showPercentage && (
        <div className="absolute top-0 right-0 -mt-5 text-xs font-semibold text-text-primary">
          {clampedProgress}%
        </div>
      )}
    </div>
  );
};

// Add shimmer animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
document.head.appendChild(style);

export default ProgressBar;
