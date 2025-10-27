/**
 * useDecisions Hook
 *
 * 决策记录管理 Hook with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDecisionStore } from '../stores/decisionStore';
import VisualizationAPI from '../services/VisualizationAPI';
import type { DecisionType, AgentType, DecisionImpact } from '../types/visualization.types';

export function useDecisions(sessionId?: string) {
  const store = useDecisionStore();
  const queryClient = useQueryClient();

  // 查询会话的决策记录
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['decisions', sessionId],
    queryFn: () => sessionId ? VisualizationAPI.getSessionDecisions(sessionId) : Promise.resolve({ data: [], total: 0, page: 1, pageSize: 50, hasMore: false }),
    enabled: !!sessionId,
    refetchInterval: false, // 使用 WebSocket 实时更新
  });

  // 查询决策统计
  const { data: stats } = useQuery({
    queryKey: ['decision-stats', sessionId],
    queryFn: () => sessionId ? VisualizationAPI.getDecisionStats(sessionId) : Promise.resolve(null),
    enabled: !!sessionId,
  });

  // 搜索决策
  const searchMutation = useMutation({
    mutationFn: (query: string) => {
      if (!sessionId) throw new Error('No session ID');
      return VisualizationAPI.searchDecisions(sessionId, query);
    },
  });

  // 标记为已读
  const markAsRead = (decisionId: string) => {
    store.markAsRead(decisionId);
  };

  // 标记所有为已读
  const markAllAsRead = () => {
    store.markAllAsRead();
  };

  // 设置过滤器
  const setFilter = (filter: { impact?: DecisionImpact; agentType?: AgentType; type?: DecisionType }) => {
    store.setFilter(filter);
  };

  // 获取过滤后的决策
  const getFilteredDecisions = () => {
    return store.getFilteredDecisions();
  };

  return {
    decisions: store.decisions,
    filteredDecisions: getFilteredDecisions(),
    unreadCount: store.unreadCount,
    selectedDecision: store.selectedDecision,
    filter: store.filter,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    setFilter,
    selectDecision: store.selectDecision,
    search: searchMutation.mutate,
    searchResults: searchMutation.data,
    isSearching: searchMutation.isPending,
    refetch,
  };
}
