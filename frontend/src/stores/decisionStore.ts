/**
 * Decision Store
 *
 * 决策记录状态管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DecisionRecord, DecisionImpact, AgentType, DecisionType, DecisionState } from '../types/visualization.types';
import WebSocketService from '../services/WebSocketService';
import { showDecisionToast } from '../components/Visualization/DecisionToast';

interface DecisionStore extends DecisionState {
  addDecision: (decision: DecisionRecord) => void;
  addDecisions: (decisions: DecisionRecord[]) => void;
  markAsRead: (decisionId: string) => void;
  markAllAsRead: () => void;
  setFilter: (filter: DecisionState['filter']) => void;
  selectDecision: (decision: DecisionRecord | null) => void;
  clearDecisions: () => void;
  getFilteredDecisions: () => DecisionRecord[];
  setupWebSocketListeners: (sessionId: string, onDecisionClick?: (id: string) => void) => () => void;
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
          decisions: [{ ...decision, isRead: decision.isRead || false }, ...state.decisions],
          unreadCount: decision.isRead ? state.unreadCount : state.unreadCount + 1,
        }),
        false,
        'addDecision'
      ),

    addDecisions: (decisions) =>
      set(
        (state) => {
          const newUnreadCount = decisions.filter(d => !d.isRead).length;
          return {
            decisions: [...decisions.map(d => ({ ...d, isRead: d.isRead || false })), ...state.decisions],
            unreadCount: state.unreadCount + newUnreadCount,
          };
        },
        false,
        'addDecisions'
      ),

    markAsRead: (decisionId) =>
      set(
        (state) => {
          const decision = state.decisions.find((d) => d.decisionId === decisionId);
          if (!decision || decision.isRead) return state;

          return {
            decisions: state.decisions.map((d) =>
              d.decisionId === decisionId ? { ...d, isRead: true } : d
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
          decisions: state.decisions.map((d) => ({ ...d, isRead: true })),
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

    setupWebSocketListeners: (sessionId: string, onDecisionClick?: (id: string) => void) => {
      console.log(`[DecisionStore] Setting up WebSocket listeners for session ${sessionId}`);

      // 高优先级决策（立即显示 Toast）
      const unsubscribeDecisionCreated = WebSocketService.on(
        'visualization:decision-created',
        (data: any) => {
          console.log('[DecisionStore] Received decision-created event:', data);
          const decision = data as DecisionRecord;

          // 添加到 store
          get().addDecision(decision);

          // 如果是高重要性决策，显示 Toast
          if (decision.importance === 'critical' || decision.importance === 'high') {
            showDecisionToast(
              decision,
              (decisionId) => {
                // 查看决策
                get().markAsRead(decisionId);
                get().selectDecision(decision);
                onDecisionClick?.(decisionId);
              },
              (decisionId) => {
                // 忽略决策（标记为已读）
                get().markAsRead(decisionId);
              }
            );
          }
        }
      );

      // 中优先级决策批量（批量添加）
      const unsubscribeDecisionBatch = WebSocketService.on(
        'visualization:decision-batch',
        (data: { decisions: DecisionRecord[]; count: number; type: string; timestamp: string }) => {
          console.log('[DecisionStore] Received decision-batch event:', data);
          get().addDecisions(data.decisions);
        }
      );

      // 低优先级决策（静默添加）
      const unsubscribeDecisionSilent = WebSocketService.on(
        'visualization:decision-silent',
        (data: { decisions: DecisionRecord[]; count: number; timestamp: string }) => {
          console.log('[DecisionStore] Received decision-silent event:', data);
          get().addDecisions(data.decisions);
        }
      );

      // 决策已读事件
      const unsubscribeDecisionRead = WebSocketService.on(
        'visualization:decision-read',
        (data: { decisionId: string; timestamp: string }) => {
          console.log('[DecisionStore] Received decision-read event:', data);
          get().markAsRead(data.decisionId);
        }
      );

      // 所有决策已读事件
      const unsubscribeAllDecisionsRead = WebSocketService.on(
        'visualization:all-decisions-read',
        (data: { count: number; timestamp: string }) => {
          console.log('[DecisionStore] Received all-decisions-read event:', data);
          get().markAllAsRead();
        }
      );

      // 返回清理函数
      return () => {
        console.log(`[DecisionStore] Cleaning up WebSocket listeners for session ${sessionId}`);
        unsubscribeDecisionCreated();
        unsubscribeDecisionBatch();
        unsubscribeDecisionSilent();
        unsubscribeDecisionRead();
        unsubscribeAllDecisionsRead();
      };
    },
  }))
);
