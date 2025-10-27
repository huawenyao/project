/**
 * Agent Status Store
 *
 * Agent 状态专用存储 - 优化的状态更新和查询
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AgentWorkStatus, AgentType, AgentStatusState } from '../types/visualization.types';

interface AgentStatusStore extends AgentStatusState {
  updateStatus: (status: AgentWorkStatus) => void;
  bulkUpdateStatuses: (statuses: AgentWorkStatus[]) => void;
  setProgress: (progress: number) => void;
  clearStatuses: () => void;
  getStatusByAgent: (agentType: AgentType) => AgentWorkStatus | undefined;
  getActiveAgentStatuses: () => AgentWorkStatus[];
}

export const useAgentStatusStore = create<AgentStatusStore>()(
  devtools((set, get) => ({
    statuses: {},
    activeAgents: [],
    progress: 0,
    lastUpdate: null,

    updateStatus: (status) =>
      set(
        (state) => {
          const statuses = { ...state.statuses, [status.statusId]: status };
          const activeAgents = Object.values(statuses)
            .filter((s) => s.status === 'in_progress' || s.status === 'retrying')
            .map((s) => s.agentType)
            .filter((v, i, a) => a.indexOf(v) === i);

          const totalProgress =
            Object.values(statuses).reduce((sum, s) => sum + s.progressPercentage, 0) /
            Math.max(Object.keys(statuses).length, 1);

          return {
            statuses,
            activeAgents,
            progress: Math.round(totalProgress),
            lastUpdate: new Date().toISOString(),
          };
        },
        false,
        'updateStatus'
      ),

    bulkUpdateStatuses: (newStatuses) =>
      set(
        (state) => {
          const statuses = { ...state.statuses };
          newStatuses.forEach((status) => {
            statuses[status.statusId] = status;
          });

          const activeAgents = Object.values(statuses)
            .filter((s) => s.status === 'in_progress' || s.status === 'retrying')
            .map((s) => s.agentType)
            .filter((v, i, a) => a.indexOf(v) === i);

          const totalProgress =
            Object.values(statuses).reduce((sum, s) => sum + s.progressPercentage, 0) /
            Math.max(Object.keys(statuses).length, 1);

          return {
            statuses,
            activeAgents,
            progress: Math.round(totalProgress),
            lastUpdate: new Date().toISOString(),
          };
        },
        false,
        'bulkUpdateStatuses'
      ),

    setProgress: (progress) => set({ progress }, false, 'setProgress'),

    clearStatuses: () =>
      set(
        {
          statuses: {},
          activeAgents: [],
          progress: 0,
          lastUpdate: null,
        },
        false,
        'clearStatuses'
      ),

    getStatusByAgent: (agentType) => {
      const statuses = get().statuses;
      return Object.values(statuses).find((s) => s.agentType === agentType);
    },

    getActiveAgentStatuses: () => {
      const statuses = get().statuses;
      return Object.values(statuses).filter(
        (s) => s.status === 'in_progress' || s.status === 'retrying'
      );
    },
  }))
);
