/**
 * Builder 页面状态管理
 * 使用 Zustand 管理构建会话的客户端 UI 状态
 */

import { create } from 'zustand';
import type {
  AgentWorkStatus,
  DecisionRecord,
  AgentErrorRecord,
} from '../types/visualization';

interface BuilderState {
  // 构建会话
  currentSessionId: string | null;
  sessionStatus: 'idle' | 'building' | 'completed' | 'failed';

  // Agent 状态
  agents: AgentWorkStatus[];

  // 决策
  decisions: DecisionRecord[];
  unreadDecisions: number;

  // 错误
  errors: AgentErrorRecord[];

  // UI 状态
  viewMode: 'list' | 'graph';
  focusMode: boolean;
  sidebarCollapsed: boolean;
  collaborationPanelExpanded: boolean;

  // Actions
  setSessionId: (id: string | null) => void;
  setSessionStatus: (status: BuilderState['sessionStatus']) => void;

  updateAgentStatus: (agent: AgentWorkStatus) => void;
  setAgents: (agents: AgentWorkStatus[]) => void;

  addDecision: (decision: DecisionRecord) => void;
  markDecisionAsRead: (id: string) => void;
  markAllDecisionsAsRead: () => void;

  addError: (error: AgentErrorRecord) => void;
  removeError: (errorId: string) => void;

  toggleViewMode: () => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  toggleCollaborationPanel: () => void;

  reset: () => void;
}

const initialState = {
  currentSessionId: null,
  sessionStatus: 'idle' as const,
  agents: [],
  decisions: [],
  unreadDecisions: 0,
  errors: [],
  viewMode: 'list' as const,
  focusMode: false,
  sidebarCollapsed: false,
  collaborationPanelExpanded: false,
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ currentSessionId: id }),

  setSessionStatus: (status) => set({ sessionStatus: status }),

  updateAgentStatus: (agent) =>
    set((state) => {
      const existingIndex = state.agents.findIndex(
        (a) => a.agentId === agent.agentId
      );
      if (existingIndex >= 0) {
        const newAgents = [...state.agents];
        newAgents[existingIndex] = agent;
        return { agents: newAgents };
      }
      return { agents: [...state.agents, agent] };
    }),

  setAgents: (agents) => set({ agents }),

  addDecision: (decision) =>
    set((state) => ({
      decisions: [decision, ...state.decisions],
      unreadDecisions: decision.read ? state.unreadDecisions : state.unreadDecisions + 1,
    })),

  markDecisionAsRead: (id) =>
    set((state) => {
      const decision = state.decisions.find((d) => d.decisionId === id);
      if (!decision || decision.read) return state;

      return {
        decisions: state.decisions.map((d) =>
          d.decisionId === id ? { ...d, read: true } : d
        ),
        unreadDecisions: Math.max(0, state.unreadDecisions - 1),
      };
    }),

  markAllDecisionsAsRead: () =>
    set((state) => ({
      decisions: state.decisions.map((d) => ({ ...d, read: true })),
      unreadDecisions: 0,
    })),

  addError: (error) =>
    set((state) => ({
      errors: [error, ...state.errors],
    })),

  removeError: (errorId) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.errorId !== errorId),
    })),

  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'list' ? 'graph' : 'list',
    })),

  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleCollaborationPanel: () =>
    set((state) => ({
      collaborationPanelExpanded: !state.collaborationPanelExpanded,
    })),

  reset: () => set(initialState),
}));
