/**
 * LoadingSpinner
 *
 * 加载动画 UI 组件
 * 支持多种样式和尺寸
 */

import React from 'react';

export type SpinnerVariant = 'circle' | 'dots' | 'bars' | 'pulse';

export interface LoadingSpinnerProps {
  variant?: SpinnerVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'circle',
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className = '',
}) => {
  // 获取尺寸类
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      case 'md':
      default:
        return 'w-8 h-8';
    }
  };

  // 获取颜色类
  const getColorClass = () => {
    switch (color) {
      case 'secondary':
        return 'text-secondary';
      case 'white':
        return 'text-white';
      case 'current':
        return 'text-current';
      case 'primary':
      default:
        return 'text-primary';
    }
  };

  // Circle Spinner
  const CircleSpinner = () => (
    <svg className={`${getSizeClass()} ${getColorClass()} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  // Dots Spinner
  const DotsSpinner = () => {
    const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : size === 'xl' ? 'w-5 h-5' : 'w-3 h-3';
    return (
      <div className="flex space-x-2">
        <div className={`${dotSize} ${getColorClass()} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${dotSize} ${getColorClass()} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${dotSize} ${getColorClass()} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  };

  // Bars Spinner
  const BarsSpinner = () => {
    const barSize = size === 'sm' ? 'w-1 h-4' : size === 'lg' ? 'w-2 h-12' : size === 'xl' ? 'w-3 h-16' : 'w-1.5 h-8';
    return (
      <div className="flex items-end space-x-1">
        <div className={`${barSize} ${getColorClass()} bg-current rounded animate-pulse`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${barSize} ${getColorClass()} bg-current rounded animate-pulse`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${barSize} ${getColorClass()} bg-current rounded animate-pulse`} style={{ animationDelay: '300ms' }}></div>
        <div className={`${barSize} ${getColorClass()} bg-current rounded animate-pulse`} style={{ animationDelay: '450ms' }}></div>
      </div>
    );
  };

  // Pulse Spinner
  const PulseSpinner = () => (
    <div className={`${getSizeClass()} ${getColorClass()} bg-current rounded-full animate-pulse-scale opacity-75`}></div>
  );

  // 选择 Spinner 变体
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />;
      case 'bars':
        return <BarsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'circle':
      default:
        return <CircleSpinner />;
    }
  };

  // Container
  const spinnerContent = (
    <div className={`loading-spinner flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {text && <p className={`mt-3 text-text-secondary ${size === 'sm' ? 'text-xs' : size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'}`}>{text}</p>}
    </div>
  );

  // Full screen wrapper
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background bg-opacity-80 backdrop-blur-sm z-modal">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;