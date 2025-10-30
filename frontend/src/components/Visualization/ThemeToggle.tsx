/**
 * T131: ThemeToggle Component
 *
 * Phase 10 - Theme System & Preferences
 *
 * 功能：
 * - 在温暖友好风和科技未来感主题之间切换
 * - 主题偏好持久化到 localStorage
 * - 平滑过渡动画
 */

import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const isWarmTheme = theme === 'warm-friendly';

  return (
    <button
      onClick={toggleTheme}
      className="
        relative inline-flex items-center justify-center
        w-14 h-8 rounded-full transition-colors duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      "
      style={{
        backgroundColor: isWarmTheme ? '#FCD34D' : '#1E293B',
      }}
      aria-label={`切换到${isWarmTheme ? '科技未来感' : '温暖友好风'}主题`}
      title={`当前: ${isWarmTheme ? '温暖友好风' : '科技未来感'}`}
    >
      {/* 滑动球 */}
      <span
        className="
          absolute left-1 top-1
          w-6 h-6 bg-white rounded-full
          shadow-md transform transition-transform duration-300
          flex items-center justify-center
        "
        style={{
          transform: isWarmTheme ? 'translateX(0)' : 'translateX(1.5rem)',
        }}
      >
        {isWarmTheme ? (
          <SunIcon className="w-4 h-4 text-yellow-600" />
        ) : (
          <MoonIcon className="w-4 h-4 text-blue-600" />
        )}
      </span>

      {/* 标签 */}
      <span
        className="
          absolute text-xs font-medium
          transition-all duration-300
        "
        style={{
          left: isWarmTheme ? '2.75rem' : '0.5rem',
          color: isWarmTheme ? '#92400E' : '#E0E7FF',
        }}
      >
        {isWarmTheme ? '暖' : '酷'}
      </span>
    </button>
  );
};

export default ThemeToggle;
