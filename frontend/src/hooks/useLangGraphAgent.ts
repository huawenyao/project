/**
 * useLangGraphAgent Hook
 *
 * React Hook for interacting with LangGraph Agents
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import langGraphService, { LangGraphAgentResponse, LangGraphError, LangGraphChunk } from '../services/LangGraphService';

export interface UseLangGraphAgentOptions {
  agentName: 'builder_agent' | 'ui_agent' | 'database_agent';
  streaming?: boolean;
  onComplete?: (response: LangGraphAgentResponse) => void;
  onError?: (error: LangGraphError) => void;
  onChunk?: (chunk: any) => void;
}

export interface UseLangGraphAgentResult {
  // 状态
  loading: boolean;
  error: LangGraphError | null;
  response: LangGraphAgentResponse | null;
  chunks: any[];
  sessionId: string | null;

  // 方法
  run: (request: string, context?: any) => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * useLangGraphAgent Hook
 *
 * 用于与 LangGraph Agent 交互的 React Hook
 *
 * @example
 * ```tsx
 * const { loading, response, error, run } = useLangGraphAgent({
 *   agentName: 'builder_agent',
 *   streaming: true,
 *   onComplete: (res) => console.log('完成:', res),
 * });
 *
 * // 运行 Agent
 * run('创建一个待办事项应用');
 * ```
 */
export function useLangGraphAgent(options: UseLangGraphAgentOptions): UseLangGraphAgentResult {
  const { agentName, streaming = false, onComplete, onError, onChunk } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LangGraphError | null>(null);
  const [response, setResponse] = useState<LangGraphAgentResponse | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 使用 ref 来保存最新的 callback，避免在 effect 中使用闭包
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onChunkRef = useRef(onChunk);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onChunkRef.current = onChunk;
  }, [onComplete, onError, onChunk]);

  // 监听 LangGraph 事件
  useEffect(() => {
    const handleStart = (data: any) => {
      if (data.sessionId === sessionId) {
        console.log('[useLangGraphAgent] Agent started');
      }
    };

    const handleComplete = (data: LangGraphAgentResponse) => {
      if (data.sessionId === sessionId) {
        console.log('[useLangGraphAgent] Agent completed');
        setLoading(false);
        setResponse(data);
        onCompleteRef.current?.(data);
      }
    };

    const handleChunk = (data: { chunk: LangGraphChunk; sessionId?: string }) => {
      if (data.sessionId === sessionId) {
        console.log('[useLangGraphAgent] Received chunk');
        setChunks((prev) => [...prev, data.chunk]);
        onChunkRef.current?.(data.chunk);
      }
    };

    const handleError = (data: LangGraphError) => {
      if (data.sessionId === sessionId) {
        console.error('[useLangGraphAgent] Agent error:', data.error);
        setLoading(false);
        setError(data);
        onErrorRef.current?.(data);
      }
    };

    // 注册事件监听器
    langGraphService.on('agent:start', handleStart);
    langGraphService.on('agent:complete', handleComplete);
    langGraphService.on('agent:chunk', handleChunk);
    langGraphService.on('agent:error', handleError);

    // 清理
    return () => {
      langGraphService.off('agent:start', handleStart);
      langGraphService.off('agent:complete', handleComplete);
      langGraphService.off('agent:chunk', handleChunk);
      langGraphService.off('agent:error', handleError);
    };
  }, [sessionId]);

  /**
   * 运行 Agent
   */
  const run = useCallback(
    (request: string, context?: any) => {
      // 重置状态
      setLoading(true);
      setError(null);
      setResponse(null);
      setChunks([]);

      // 运行 Agent
      let newSessionId: string;

      if (streaming) {
        newSessionId = langGraphService.streamAgent({
          agentName,
          request,
          context,
        });
      } else {
        newSessionId = langGraphService.runAgent({
          agentName,
          request,
          context,
        });
      }

      setSessionId(newSessionId);
      console.log('[useLangGraphAgent] Started with session:', newSessionId);
    },
    [agentName, streaming]
  );

  /**
   * 取消 Agent
   */
  const cancel = useCallback(() => {
    if (sessionId) {
      langGraphService.cancelAgent(sessionId);
      setLoading(false);
      setSessionId(null);
    }
  }, [sessionId]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResponse(null);
    setChunks([]);
    setSessionId(null);
  }, []);

  return {
    loading,
    error,
    response,
    chunks,
    sessionId,
    run,
    cancel,
    reset,
  };
}

/**
 * useLangGraphBuilderAgent Hook
 * 专门用于 Builder Agent 的简化 Hook
 */
export function useLangGraphBuilderAgent(
  options?: Omit<UseLangGraphAgentOptions, 'agentName'>
): UseLangGraphAgentResult {
  return useLangGraphAgent({
    agentName: 'builder_agent',
    ...options,
  });
}

/**
 * useLangGraphUIAgent Hook
 * 专门用于 UI Agent 的简化 Hook
 */
export function useLangGraphUIAgent(
  options?: Omit<UseLangGraphAgentOptions, 'agentName'>
): UseLangGraphAgentResult {
  return useLangGraphAgent({
    agentName: 'ui_agent',
    ...options,
  });
}

/**
 * useLangGraphDatabaseAgent Hook
 * 专门用于 Database Agent 的简化 Hook
 */
export function useLangGraphDatabaseAgent(
  options?: Omit<UseLangGraphAgentOptions, 'agentName'>
): UseLangGraphAgentResult {
  return useLangGraphAgent({
    agentName: 'database_agent',
    ...options,
  });
}
