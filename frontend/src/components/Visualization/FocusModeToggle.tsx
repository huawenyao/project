/**
 * T132: FocusModeToggle Component
 *
 * Phase 10 - Theme System & Preferences
 *
 * 功能：
 * - 切换专注模式（隐藏低优先级 Agent 和决策）
 * - 用户设置持久化
 */

import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface FocusModeToggleProps {
  focusMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  focusMode,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${
          focusMode
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${className}
      `}
      aria-label={focusMode ? '退出专注模式' : '进入专注模式'}
    >
      {focusMode ? (
        <>
          <EyeSlashIcon className="w-5 h-5" />
          <span className="text-sm font-medium">专注模式</span>
        </>
      ) : (
        <>
          <EyeIcon className="w-5 h-5" />
          <span className="text-sm font-medium">显示全部</span>
        </>
      )}
    </button>
  );
};

export default FocusModeToggle;
