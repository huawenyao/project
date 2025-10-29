/**
 * Agent Store
 *
 * Agent状态管理 - 管理Agent的实时状态、任务队列、依赖关系
 * Phase 4 - User Story 2: Agent协作可视化
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AgentType = 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
export type AgentStatus = 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';

export interface AgentTask {
  id: string;
  agentType: AgentType;
  description: string;
  status: AgentStatus;
  priority: number;
  dependencies: string[]; // Task IDs
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  progress: number;
  metadata?: Record<string, any>;
}

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  currentTask?: AgentTask;
  taskQueue: AgentTask[];
  completedTasks: AgentTask[];
  progressPercentage: number;
  currentOperation?: string;
  retryCount: number;
  errorMessage?: string;
  lastUpdated: string;
}

export interface AgentDependency {
  from: AgentType;
  to: AgentType;
  type: 'required' | 'optional';
  description?: string;
}

interface AgentStoreState {
  // State
  agents: Record<AgentType, AgentState>;
  dependencies: AgentDependency[];
  taskQueue: AgentTask[];
  isBuilding: boolean;
  buildStartedAt?: string;
  buildCompletedAt?: string;
  overallProgress: number;

  // WebSocket connection
  connected: boolean;
  reconnecting: boolean;

  // Actions - Agent state updates
  updateAgentStatus: (agentType: AgentType, status: AgentStatus) => void;
  updateAgentProgress: (agentType: AgentType, progress: number, operation?: string) => void;
  setAgentError: (agentType: AgentType, error: string) => void;
  incrementRetryCount: (agentType: AgentType) => void;
  resetRetryCount: (agentType: AgentType) => void;

  // Actions - Task management
  addTask: (task: AgentTask) => void;
  updateTask: (taskId: string, updates: Partial<AgentTask>) => void;
  completeTask: (taskId: string) => void;
  failTask: (taskId: string, error: string) => void;
  assignTaskToAgent: (taskId: string, agentType: AgentType) => void;
  removeTaskFromQueue: (taskId: string) => void;

  // Actions - Build lifecycle
  startBuild: () => void;
  completeBuild: () => void;
  stopBuild: () => void;
  resetBuild: () => void;

  // Actions - Dependencies
  setDependencies: (dependencies: AgentDependency[]) => void;
  addDependency: (dependency: AgentDependency) => void;

  // Actions - WebSocket
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;

  // Getters
  getAgent: (agentType: AgentType) => AgentState;
  getActiveAgents: () => AgentState[];
  getIdleAgents: () => AgentState[];
  getCompletedAgents: () => AgentState[];
  getFailedAgents: () => AgentState[];
  getTaskById: (taskId: string) => AgentTask | undefined;
  getPendingTasks: () => AgentTask[];
  getTasksForAgent: (agentType: AgentType) => AgentTask[];
  calculateOverallProgress: () => number;

  // Reset
  reset: () => void;
}

const AGENT_TYPES: AgentType[] = [
  'UIAgent',
  'BackendAgent',
  'DatabaseAgent',
  'IntegrationAgent',
  'DeploymentAgent',
];

const createInitialAgentState = (type: AgentType): AgentState => ({
  type,
  status: 'idle',
  taskQueue: [],
  completedTasks: [],
  progressPercentage: 0,
  retryCount: 0,
  lastUpdated: new Date().toISOString(),
});

const initialState: Omit<AgentStoreState, keyof ReturnType<typeof createActions>> = {
  agents: AGENT_TYPES.reduce((acc, type) => {
    acc[type] = createInitialAgentState(type);
    return acc;
  }, {} as Record<AgentType, AgentState>),
  dependencies: [],
  taskQueue: [],
  isBuilding: false,
  overallProgress: 0,
  connected: false,
  reconnecting: false,
};

const createActions = (set: any, get: any) => ({
  // Agent state updates
  updateAgentStatus: (agentType: AgentType, status: AgentStatus) =>
    set(
      (state: AgentStoreState) => ({
        agents: {
          ...state.agents,
          [agentType]: {
            ...state.agents[agentType],
            status,
            lastUpdated: new Date().toISOString(),
          },
        },
      }),
      false,
      'updateAgentStatus'
    ),

  updateAgentProgress: (agentType: AgentType, progress: number, operation?: string) =>
    set(
      (state: AgentStoreState) => ({
        agents: {
          ...state.agents,
          [agentType]: {
            ...state.agents[agentType],
            progressPercentage: Math.min(100, Math.max(0, progress)),
            currentOperation: operation || state.agents[agentType].currentOperation,
            lastUpdated: new Date().toISOString(),
          },
        },
        overallProgress: get().calculateOverallProgress(),
      }),
      false,
      'updateAgentProgress'
    ),

  setAgentError: (agentType: AgentType, error: string) =>
    set(
      (state: AgentStoreState) => ({
        agents: {
          ...state.agents,
          [agentType]: {
            ...state.agents[agentType],
            status: 'failed',
            errorMessage: error,
            lastUpdated: new Date().toISOString(),
          },
        },
      }),
      false,
      'setAgentError'
    ),

  incrementRetryCount: (agentType: AgentType) =>
    set(
      (state: AgentStoreState) => ({
        agents: {
          ...state.agents,
          [agentType]: {
            ...state.agents[agentType],
            retryCount: state.agents[agentType].retryCount + 1,
            status: 'retrying',
          },
        },
      }),
      false,
      'incrementRetryCount'
    ),

  resetRetryCount: (agentType: AgentType) =>
    set(
      (state: AgentStoreState) => ({
        agents: {
          ...state.agents,
          [agentType]: {
            ...state.agents[agentType],
            retryCount: 0,
          },
        },
      }),
      false,
      'resetRetryCount'
    ),

  // Task management
  addTask: (task: AgentTask) =>
    set(
      (state: AgentStoreState) => {
        const agent = state.agents[task.agentType];
        return {
          taskQueue: [...state.taskQueue, task],
          agents: {
            ...state.agents,
            [task.agentType]: {
              ...agent,
              taskQueue: [...agent.taskQueue, task],
            },
          },
        };
      },
      false,
      'addTask'
    ),

  updateTask: (taskId: string, updates: Partial<AgentTask>) =>
    set(
      (state: AgentStoreState) => {
        const updateTaskInList = (tasks: AgentTask[]) =>
          tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));

        const task = state.taskQueue.find((t) => t.id === taskId);
        if (!task) return state;

        return {
          taskQueue: updateTaskInList(state.taskQueue),
          agents: {
            ...state.agents,
            [task.agentType]: {
              ...state.agents[task.agentType],
              taskQueue: updateTaskInList(state.agents[task.agentType].taskQueue),
              currentTask:
                state.agents[task.agentType].currentTask?.id === taskId
                  ? { ...state.agents[task.agentType].currentTask!, ...updates }
                  : state.agents[task.agentType].currentTask,
            },
          },
        };
      },
      false,
      'updateTask'
    ),

  completeTask: (taskId: string) =>
    set(
      (state: AgentStoreState) => {
        const task = state.taskQueue.find((t) => t.id === taskId);
        if (!task) return state;

        const completedTask: AgentTask = {
          ...task,
          status: 'completed',
          completedAt: new Date().toISOString(),
          progress: 100,
        };

        const agent = state.agents[task.agentType];

        return {
          taskQueue: state.taskQueue.filter((t) => t.id !== taskId),
          agents: {
            ...state.agents,
            [task.agentType]: {
              ...agent,
              taskQueue: agent.taskQueue.filter((t) => t.id !== taskId),
              completedTasks: [...agent.completedTasks, completedTask],
              currentTask: agent.currentTask?.id === taskId ? undefined : agent.currentTask,
              progressPercentage: agent.taskQueue.length === 1 ? 100 : agent.progressPercentage,
              status: agent.taskQueue.length === 1 ? 'completed' : agent.status,
            },
          },
        };
      },
      false,
      'completeTask'
    ),

  failTask: (taskId: string, error: string) =>
    set(
      (state: AgentStoreState) => {
        const task = state.taskQueue.find((t) => t.id === taskId);
        if (!task) return state;

        const updates: Partial<AgentTask> = {
          status: 'failed',
          errorMessage: error,
        };

        get().updateTask(taskId, updates);
        get().setAgentError(task.agentType, error);

        return state;
      },
      false,
      'failTask'
    ),

  assignTaskToAgent: (taskId: string, agentType: AgentType) =>
    set(
      (state: AgentStoreState) => {
        const task = state.taskQueue.find((t) => t.id === taskId);
        if (!task) return state;

        const updatedTask: AgentTask = {
          ...task,
          agentType,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
        };

        return {
          taskQueue: state.taskQueue.map((t) => (t.id === taskId ? updatedTask : t)),
          agents: {
            ...state.agents,
            [agentType]: {
              ...state.agents[agentType],
              currentTask: updatedTask,
              status: 'in_progress',
              taskQueue: [...state.agents[agentType].taskQueue, updatedTask],
            },
          },
        };
      },
      false,
      'assignTaskToAgent'
    ),

  removeTaskFromQueue: (taskId: string) =>
    set(
      (state: AgentStoreState) => {
        const task = state.taskQueue.find((t) => t.id === taskId);
        if (!task) return state;

        return {
          taskQueue: state.taskQueue.filter((t) => t.id !== taskId),
          agents: {
            ...state.agents,
            [task.agentType]: {
              ...state.agents[task.agentType],
              taskQueue: state.agents[task.agentType].taskQueue.filter((t) => t.id !== taskId),
            },
          },
        };
      },
      false,
      'removeTaskFromQueue'
    ),

  // Build lifecycle
  startBuild: () =>
    set(
      {
        isBuilding: true,
        buildStartedAt: new Date().toISOString(),
        overallProgress: 0,
      },
      false,
      'startBuild'
    ),

  completeBuild: () =>
    set(
      {
        isBuilding: false,
        buildCompletedAt: new Date().toISOString(),
        overallProgress: 100,
      },
      false,
      'completeBuild'
    ),

  stopBuild: () =>
    set(
      {
        isBuilding: false,
      },
      false,
      'stopBuild'
    ),

  resetBuild: () =>
    set(
      {
        ...initialState,
      },
      false,
      'resetBuild'
    ),

  // Dependencies
  setDependencies: (dependencies: AgentDependency[]) =>
    set({ dependencies }, false, 'setDependencies'),

  addDependency: (dependency: AgentDependency) =>
    set(
      (state: AgentStoreState) => ({
        dependencies: [...state.dependencies, dependency],
      }),
      false,
      'addDependency'
    ),

  // WebSocket
  setConnected: (connected: boolean) =>
    set({ connected }, false, 'setConnected'),

  setReconnecting: (reconnecting: boolean) =>
    set({ reconnecting }, false, 'setReconnecting'),

  // Getters
  getAgent: (agentType: AgentType) => get().agents[agentType],

  getActiveAgents: () =>
    Object.values(get().agents).filter(
      (agent: AgentState) => agent.status === 'in_progress' || agent.status === 'retrying'
    ),

  getIdleAgents: () =>
    Object.values(get().agents).filter((agent: AgentState) => agent.status === 'idle'),

  getCompletedAgents: () =>
    Object.values(get().agents).filter((agent: AgentState) => agent.status === 'completed'),

  getFailedAgents: () =>
    Object.values(get().agents).filter((agent: AgentState) => agent.status === 'failed'),

  getTaskById: (taskId: string) => get().taskQueue.find((t: AgentTask) => t.id === taskId),

  getPendingTasks: () =>
    get().taskQueue.filter((t: AgentTask) => t.status === 'pending'),

  getTasksForAgent: (agentType: AgentType) =>
    get().taskQueue.filter((t: AgentTask) => t.agentType === agentType),

  calculateOverallProgress: () => {
    const agents = Object.values(get().agents) as AgentState[];
    const totalProgress = agents.reduce((sum, agent) => sum + agent.progressPercentage, 0);
    return Math.round(totalProgress / agents.length);
  },

  // Reset
  reset: () => set(initialState, false, 'reset'),
});

export const useAgentStore = create<AgentStoreState>()(
  devtools((set, get) => ({
    ...initialState,
    ...createActions(set, get),
  }))
);

// Selectors
export const selectAgents = (state: AgentStoreState) => state.agents;
export const selectAgent = (agentType: AgentType) => (state: AgentStoreState) =>
  state.agents[agentType];
export const selectIsBuilding = (state: AgentStoreState) => state.isBuilding;
export const selectOverallProgress = (state: AgentStoreState) => state.overallProgress;
export const selectActiveAgents = (state: AgentStoreState) => state.getActiveAgents();
export const selectTaskQueue = (state: AgentStoreState) => state.taskQueue;
export const selectDependencies = (state: AgentStoreState) => state.dependencies;
export const selectConnected = (state: AgentStoreState) => state.connected;
