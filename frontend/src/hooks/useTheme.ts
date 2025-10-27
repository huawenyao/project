/**
 * useTheme Hook
 *
 * 主题切换和管理 Hook
 */

import { useEffect, useCallback } from 'react';
import { useThemeStore } from '../stores/themeStore';
import type { ThemeMode } from '../types/visualization.types';

export function useTheme() {
  const {
    currentMode,
    currentTheme,
    setTheme,
    toggleTheme,
  } = useThemeStore();

  // 应用主题到 DOM
  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;

    // 移除旧主题类
    root.classList.remove('theme-warm-friendly', 'theme-tech-futuristic');

    // 添加新主题类
    root.classList.add(`theme-${mode}`);

    // 设置 data 属性用于 CSS 选择器
    root.setAttribute('data-theme', mode);

    // 应用主题颜色变量到 CSS
    const theme = mode === 'warm-friendly'
      ? useThemeStore.getState().warmFriendlyTheme
      : useThemeStore.getState().techFuturisticTheme;

    // 设置 CSS 变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      } else if (typeof value === 'object') {
        // 处理嵌套对象（如 agent 状态颜色）
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue as string);
        });
      }
    });

    // 设置字体
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-size-base', theme.typography.fontSize);

    // 设置间距
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // 设置阴影
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // 设置圆角
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // 设置动画时长
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
  }, []);

  // 初始化和主题变化时应用主题
  useEffect(() => {
    applyTheme(currentMode);
  }, [currentMode, applyTheme]);

  // 监听系统主题变化（可选）
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // 如果用户没有手动设置主题，跟随系统
      const hasManualPreference = localStorage.getItem('theme-preference');
      if (!hasManualPreference) {
        // 根据系统偏好选择主题
        // 注意：我们的主题不是简单的 light/dark，而是 warm-friendly/tech-futuristic
        // 这里可以根据项目需求决定如何映射
        // 暂时注释掉自动切换，保持用户选择
        // setTheme(e.matches ? 'tech-futuristic' : 'warm-friendly');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setTheme]);

  // 获取当前主题的特定颜色
  const getColor = useCallback((colorKey: string): string => {
    const keys = colorKey.split('.');
    let value: any = currentTheme.colors;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return '';
    }

    return value as string;
  }, [currentTheme]);

  // 检查是否为暗色主题
  const isDark = currentMode === 'tech-futuristic';

  // 预加载另一个主题的资源（优化切换体验）
  const preloadOtherTheme = useCallback(() => {
    const otherMode = currentMode === 'warm-friendly' ? 'tech-futuristic' : 'warm-friendly';
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/themes/${otherMode}.css`;
    document.head.appendChild(link);
  }, [currentMode]);

  // 在组件挂载时预加载
  useEffect(() => {
    // 延迟预加载，避免影响初始加载性能
    const timer = setTimeout(preloadOtherTheme, 2000);
    return () => clearTimeout(timer);
  }, [preloadOtherTheme]);

  return {
    // 当前主题
    mode: currentMode,
    theme: currentTheme,
    isDark,

    // 主题切换
    setTheme,
    toggleTheme,

    // 工具方法
    getColor,
    applyTheme,

    // 主题信息
    isWarmFriendly: currentMode === 'warm-friendly',
    isTechFuturistic: currentMode === 'tech-futuristic',
  };
}
