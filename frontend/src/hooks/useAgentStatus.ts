/**
 * useAgentStatus Hook
 *
 * Agent 状态管理 Hook with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { useAgentStatusStore } from '../stores/agentStatusStore';
import VisualizationAPI from '../services/VisualizationAPI';
import type { AgentType } from '../types/visualization.types';

export function useAgentStatus(sessionId?: string) {
  const store = useAgentStatusStore();

  // 查询会话的 Agent 状态
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agent-statuses', sessionId],
    queryFn: () => sessionId ? VisualizationAPI.getSessionAgentStatuses(sessionId) : Promise.resolve([]),
    enabled: !!sessionId,
    refetchInterval: false, // 使用 WebSocket 实时更新，不需要轮询
  });

  // 查询 Agent personas
  const { data: personas } = useQuery({
    queryKey: ['agent-personas'],
    queryFn: () => VisualizationAPI.getAgentPersonas(),
    staleTime: Infinity, // Personas 不经常变化
  });

  // 获取特定 Agent 的状态
  const getAgentStatus = (agentType: AgentType) => {
    return store.getStatusByAgent(agentType);
  };

  // 获取活跃的 Agents
  const getActiveAgents = () => {
    return store.getActiveAgentStatuses();
  };

  return {
    statuses: Object.values(store.statuses),
    activeAgents: store.activeAgents,
    progress: store.progress,
    lastUpdate: store.lastUpdate,
    personas,
    isLoading,
    error,
    getAgentStatus,
    getActiveAgents,
    refetch,
  };
}
