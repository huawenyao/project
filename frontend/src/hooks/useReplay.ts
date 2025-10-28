/**
 * useReplay Hook
 *
 * 历史会话回放管理 Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import VisualizationAPI from '../services/VisualizationAPI';
import type {
  BuildSession,
  AgentWorkStatus,
  DecisionRecord,
  ErrorLog,
  CollaborationEvent
} from '../types/visualization.types';

export type ReplaySpeed = 0.5 | 1 | 2 | 5 | 10;
export type ReplayState = 'idle' | 'playing' | 'paused' | 'completed';

interface ReplayEvent {
  timestamp: string;
  type: 'agent_status' | 'decision' | 'error' | 'collaboration';
  data: AgentWorkStatus | DecisionRecord | ErrorLog | CollaborationEvent;
}

interface ReplaySnapshot {
  session: BuildSession;
  events: ReplayEvent[];
  totalDuration: number;
}

interface UseReplayOptions {
  autoPlay?: boolean;
  defaultSpeed?: ReplaySpeed;
  onEventReplay?: (event: ReplayEvent) => void;
  onComplete?: () => void;
}

export function useReplay(sessionId?: string, options: UseReplayOptions = {}) {
  const {
    autoPlay = false,
    defaultSpeed = 1,
    onEventReplay,
    onComplete,
  } = options;

  const [state, setState] = useState<ReplayState>('idle');
  const [speed, setSpeed] = useState<ReplaySpeed>(defaultSpeed);
  const [currentTime, setCurrentTime] = useState(0); // milliseconds
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // 加载归档会话数据
  const { data: snapshot, isLoading, error } = useQuery<ReplaySnapshot>({
    queryKey: ['replay-session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');

      // 获取会话详情
      const session = await VisualizationAPI.getSession(sessionId);

      // 如果会话已归档，从归档加载
      if (session.archived) {
        const archivedData = await VisualizationAPI.getArchivedSession(sessionId);
        return archivedData;
      }

      // 否则从实时数据构建快照
      const [agentStatuses, decisions, errors, collaborations] = await Promise.all([
        VisualizationAPI.getSessionAgentStatuses(sessionId),
        VisualizationAPI.getSessionDecisions(sessionId),
        VisualizationAPI.getSessionErrors(sessionId),
        VisualizationAPI.getSessionCollaborations(sessionId),
      ]);

      // 将所有事件按时间排序
      const events: ReplayEvent[] = [
        ...agentStatuses.map((status: AgentWorkStatus) => ({
          timestamp: status.startTime || status.updatedAt,
          type: 'agent_status' as const,
          data: status,
        })),
        ...decisions.data.map((decision: DecisionRecord) => ({
          timestamp: decision.timestamp,
          type: 'decision' as const,
          data: decision,
        })),
        ...errors.data.map((error: ErrorLog) => ({
          timestamp: error.timestamp,
          type: 'error' as const,
          data: error,
        })),
        ...collaborations.data.map((collab: CollaborationEvent) => ({
          timestamp: collab.timestamp,
          type: 'collaboration' as const,
          data: collab,
        })),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // 计算总时长
      const startTime = new Date(session.startTime).getTime();
      const endTime = session.endTime
        ? new Date(session.endTime).getTime()
        : Date.now();
      const totalDuration = endTime - startTime;

      return {
        session,
        events,
        totalDuration,
      };
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 播放控制
  const play = useCallback(() => {
    if (!snapshot || state === 'completed') return;

    setState('playing');
    startTimeRef.current = Date.now() - (pausedAtRef.current || 0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const scaledElapsed = elapsed * speed;
      setCurrentTime(scaledElapsed);

      // 检查是否有新事件需要播放
      if (snapshot.events[currentEventIndex]) {
        const event = snapshot.events[currentEventIndex];
        const eventTime = new Date(event.timestamp).getTime() -
                         new Date(snapshot.session.startTime).getTime();

        if (scaledElapsed >= eventTime) {
          onEventReplay?.(event);
          setCurrentEventIndex(prev => prev + 1);
        }
      }

      // 检查是否完成
      if (scaledElapsed >= snapshot.totalDuration) {
        setState('completed');
        onComplete?.();
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      timerRef.current = setTimeout(tick, 16); // ~60fps
    };

    tick();
  }, [snapshot, state, speed, currentEventIndex, onEventReplay, onComplete]);

  const pause = useCallback(() => {
    if (state !== 'playing') return;

    setState('paused');
    pausedAtRef.current = currentTime;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [state, currentTime]);

  const stop = useCallback(() => {
    setState('idle');
    setCurrentTime(0);
    setCurrentEventIndex(0);
    pausedAtRef.current = 0;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!snapshot) return;

    const clampedTime = Math.max(0, Math.min(time, snapshot.totalDuration));
    setCurrentTime(clampedTime);
    pausedAtRef.current = clampedTime;

    // 找到对应的事件索引
    const sessionStartTime = new Date(snapshot.session.startTime).getTime();
    const targetTime = sessionStartTime + clampedTime;

    const newIndex = snapshot.events.findIndex(event =>
      new Date(event.timestamp).getTime() > targetTime
    );

    setCurrentEventIndex(newIndex === -1 ? snapshot.events.length : newIndex);

    // 重放所有到目标时间的事件
    for (let i = 0; i < (newIndex === -1 ? snapshot.events.length : newIndex); i++) {
      onEventReplay?.(snapshot.events[i]);
    }
  }, [snapshot, onEventReplay]);

  const changeSpeed = useCallback((newSpeed: ReplaySpeed) => {
    setSpeed(newSpeed);

    // 如果正在播放，调整时间基准
    if (state === 'playing') {
      startTimeRef.current = Date.now() - (currentTime / newSpeed);
    }
  }, [state, currentTime]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && snapshot && state === 'idle') {
      play();
    }
  }, [autoPlay, snapshot, state, play]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 获取当前播放进度（百分比）
  const progress = snapshot ? (currentTime / snapshot.totalDuration) * 100 : 0;

  // 格式化时间显示
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return {
    // 数据
    session: snapshot?.session,
    events: snapshot?.events || [],
    totalDuration: snapshot?.totalDuration || 0,

    // 播放状态
    state,
    speed,
    currentTime,
    currentEventIndex,
    progress: Math.min(100, Math.max(0, progress)),

    // 格式化显示
    currentTimeFormatted: formatTime(currentTime),
    totalDurationFormatted: formatTime(snapshot?.totalDuration || 0),

    // 加载状态
    isLoading,
    error,

    // 控制方法
    play,
    pause,
    stop,
    seek,
    changeSpeed,

    // 快捷方法
    togglePlayPause: () => state === 'playing' ? pause() : play(),
    restart: () => {
      stop();
      setTimeout(play, 0);
    },
  };
}
