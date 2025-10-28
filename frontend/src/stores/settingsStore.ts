/**
 * Settings Store
 *
 * 用户设置状态管理
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { VisualizationSettings, ThemeMode, SettingsState } from '../types/visualization.types';

interface SettingsStore extends SettingsState {
  updateSettings: (updates: Partial<VisualizationSettings>) => void;
  toggleFocusMode: () => void;
  toggleAnimations: () => void;
  toggleSound: () => void;
  toggleAnalytics: () => void;
  reset: () => void;
}

const defaultSettings: VisualizationSettings = {
  theme: 'warm-friendly',
  focusMode: false,
  showLowPriorityAgents: true,
  showLowPriorityDecisions: true,
  enableAnimations: true,
  enableSound: false,
  updateFrequency: 'realtime',
  privacy: {
    enableAnalytics: false,
    anonymizeData: true,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        settings: defaultSettings,

        updateSettings: (updates) =>
          set(
            (state) => ({
              settings: { ...state.settings, ...updates },
            }),
            false,
            'updateSettings'
          ),

        toggleFocusMode: () =>
          set(
            (state) => ({
              settings: {
                ...state.settings,
                focusMode: !state.settings.focusMode,
                showLowPriorityAgents: state.settings.focusMode, // 关闭 focus mode 时恢复显示
                showLowPriorityDecisions: state.settings.focusMode,
              },
            }),
            false,
            'toggleFocusMode'
          ),

        toggleAnimations: () =>
          set(
            (state) => ({
              settings: {
                ...state.settings,
                enableAnimations: !state.settings.enableAnimations,
              },
            }),
            false,
            'toggleAnimations'
          ),

        toggleSound: () =>
          set(
            (state) => ({
              settings: {
                ...state.settings,
                enableSound: !state.settings.enableSound,
              },
            }),
            false,
            'toggleSound'
          ),

        toggleAnalytics: () =>
          set(
            (state) => ({
              settings: {
                ...state.settings,
                privacy: {
                  ...state.settings.privacy,
                  enableAnalytics: !state.settings.privacy.enableAnalytics,
                },
              },
            }),
            false,
            'toggleAnalytics'
          ),

        reset: () =>
          set(
            { settings: defaultSettings },
            false,
            'reset'
          ),
      }),
      {
        name: 'settings-storage',
      }
    )
  )
);
