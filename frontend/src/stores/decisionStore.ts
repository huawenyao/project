/**
 * Decision Store
 *
 * 决策记录状态管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DecisionRecord, DecisionImpact, AgentType, DecisionType, DecisionState } from '../types/visualization.types';

interface DecisionStore extends DecisionState {
  addDecision: (decision: DecisionRecord) => void;
  markAsRead: (decisionId: string) => void;
  markAllAsRead: () => void;
  setFilter: (filter: DecisionState['filter']) => void;
  selectDecision: (decision: DecisionRecord | null) => void;
  clearDecisions: () => void;
  getFilteredDecisions: () => DecisionRecord[];
}

export const useDecisionStore = create<DecisionStore>()(
  devtools((set, get) => ({
    decisions: [],
    unreadCount: 0,
    filter: {},
    selectedDecision: null,

    addDecision: (decision) =>
      set(
        (state) => ({
          decisions: [{ ...decision, read: false }, ...state.decisions],
          unreadCount: state.unreadCount + 1,
        }),
        false,
        'addDecision'
      ),

    markAsRead: (decisionId) =>
      set(
        (state) => {
          const decision = state.decisions.find((d) => d.decisionId === decisionId);
          if (!decision || decision.read) return state;

          return {
            decisions: state.decisions.map((d) =>
              d.decisionId === decisionId ? { ...d, read: true } : d
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        },
        false,
        'markAsRead'
      ),

    markAllAsRead: () =>
      set(
        (state) => ({
          decisions: state.decisions.map((d) => ({ ...d, read: true })),
          unreadCount: 0,
        }),
        false,
        'markAllAsRead'
      ),

    setFilter: (filter) => set({ filter }, false, 'setFilter'),

    selectDecision: (decision) => set({ selectedDecision: decision }, false, 'selectDecision'),

    clearDecisions: () =>
      set(
        {
          decisions: [],
          unreadCount: 0,
          filter: {},
          selectedDecision: null,
        },
        false,
        'clearDecisions'
      ),

    getFilteredDecisions: () => {
      const { decisions, filter } = get();
      return decisions.filter((d) => {
        if (filter.impact && d.impact !== filter.impact) return false;
        if (filter.agentType && d.agentType !== filter.agentType) return false;
        if (filter.type && d.decisionType !== filter.type) return false;
        return true;
      });
    },
  }))
);
