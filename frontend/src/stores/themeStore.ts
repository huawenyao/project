/**
 * Theme Store
 *
 * 主题状态管理 - 支持温暖友好和科技未来两种主题
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ThemeMode, Theme, ThemeState } from '../types/visualization.types';

const warmFriendlyTheme: Theme = {
  mode: 'warm-friendly',
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    background: '#FFF9F0',
    surface: '#FFFFFF',
    text: {
      primary: '#2D3748',
      secondary: '#4A5568',
      disabled: '#A0AEC0',
    },
    status: {
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
      info: '#4299E1',
    },
    agent: {
      pending: '#CBD5E0',
      inProgress: '#4ECDC4',
      completed: '#48BB78',
      failed: '#F56565',
      retrying: '#ED8936',
      skipped: '#A0AEC0',
    },
  },
  borderRadius: '12px',
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

const techFuturisticTheme: Theme = {
  mode: 'tech-futuristic',
  colors: {
    primary: '#00D9FF',
    secondary: '#A855F7',
    accent: '#10B981',
    background: '#0A0E1A',
    surface: '#1A1F2E',
    text: {
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
      disabled: '#4B5563',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    agent: {
      pending: '#374151',
      inProgress: '#00D9FF',
      completed: '#10B981',
      failed: '#EF4444',
      retrying: '#F59E0B',
      skipped: '#6B7280',
    },
  },
  borderRadius: '8px',
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 217, 255, 0.1)',
    md: '0 4px 6px -1px rgba(0, 217, 255, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 217, 255, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 217, 255, 0.4)',
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

interface ThemeStore extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set) => ({
        mode: 'warm-friendly',
        theme: warmFriendlyTheme,

        setTheme: (mode) =>
          set(
            {
              mode,
              theme: mode === 'warm-friendly' ? warmFriendlyTheme : techFuturisticTheme,
            },
            false,
            'setTheme'
          ),

        toggleTheme: () =>
          set(
            (state) => {
              const newMode = state.mode === 'warm-friendly' ? 'tech-futuristic' : 'warm-friendly';
              return {
                mode: newMode,
                theme: newMode === 'warm-friendly' ? warmFriendlyTheme : techFuturisticTheme,
              };
            },
            false,
            'toggleTheme'
          ),
      }),
      {
        name: 'theme-storage',
      }
    )
  )
);
