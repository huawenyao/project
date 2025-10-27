/**
 * Visualization Store
 *
 * 主可视化状态管理 - 管理当前会话和整体状态
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  BuildSession,
  AgentWorkStatus,
  DecisionRecord,
  AgentErrorRecord,
  CollaborationEvent,
  PreviewData,
  AgentPersona,
  AgentType,
  VisualizationState,
} from '../types/visualization.types';

interface VisualizationStore extends VisualizationState {
  // Actions
  setCurrentSession: (session: BuildSession | null) => void;
  updateSession: (updates: Partial<BuildSession>) => void;

  setAgentStatus: (status: AgentWorkStatus) => void;
  updateAgentStatus: (statusId: string, updates: Partial<AgentWorkStatus>) => void;
  removeAgentStatus: (statusId: string) => void;

  addDecision: (decision: DecisionRecord) => void;
  markDecisionAsRead: (decisionId: string) => void;
  markAllDecisionsAsRead: () => void;

  addError: (error: AgentErrorRecord) => void;
  updateError: (errorId: string, updates: Partial<AgentErrorRecord>) => void;
  removeError: (errorId: string) => void;

  addCollaboration: (collaboration: CollaborationEvent) => void;

  setPreview: (previewId: string, preview: PreviewData) => void;
  removePreview: (previewId: string) => void;

  setPersonas: (personas: Record<AgentType, AgentPersona>) => void;
  updatePersona: (agentType: AgentType, persona: AgentPersona) => void;

  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  reset: () => void;
  clearSession: () => void;
}

const initialState: VisualizationState = {
  currentSession: null,
  agentStatuses: {},
  decisions: [],
  unreadDecisions: 0,
  errors: [],
  unresolvedErrors: 0,
  collaborations: [],
  previews: {},
  personas: {} as Record<AgentType, AgentPersona>,
  connected: false,
  reconnecting: false,
  loading: false,
  error: null,
};

export const useVisualizationStore = create<VisualizationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Session actions
        setCurrentSession: (session) =>
          set({ currentSession: session }, false, 'setCurrentSession'),

        updateSession: (updates) =>
          set(
            (state) => ({
              currentSession: state.currentSession
                ? { ...state.currentSession, ...updates }
                : null,
            }),
            false,
            'updateSession'
          ),

        // Agent status actions
        setAgentStatus: (status) =>
          set(
            (state) => ({
              agentStatuses: {
                ...state.agentStatuses,
                [status.statusId]: status,
              },
            }),
            false,
            'setAgentStatus'
          ),

        updateAgentStatus: (statusId, updates) =>
          set(
            (state) => ({
              agentStatuses: {
                ...state.agentStatuses,
                [statusId]: state.agentStatuses[statusId]
                  ? { ...state.agentStatuses[statusId], ...updates }
                  : state.agentStatuses[statusId],
              },
            }),
            false,
            'updateAgentStatus'
          ),

        removeAgentStatus: (statusId) =>
          set(
            (state) => {
              const { [statusId]: removed, ...rest } = state.agentStatuses;
              return { agentStatuses: rest };
            },
            false,
            'removeAgentStatus'
          ),

        // Decision actions
        addDecision: (decision) =>
          set(
            (state) => ({
              decisions: [decision, ...state.decisions],
              unreadDecisions: state.unreadDecisions + 1,
            }),
            false,
            'addDecision'
          ),

        markDecisionAsRead: (decisionId) =>
          set(
            (state) => {
              const decision = state.decisions.find((d) => d.decisionId === decisionId);
              if (!decision || decision.read) return state;

              return {
                decisions: state.decisions.map((d) =>
                  d.decisionId === decisionId ? { ...d, read: true } : d
                ),
                unreadDecisions: Math.max(0, state.unreadDecisions - 1),
              };
            },
            false,
            'markDecisionAsRead'
          ),

        markAllDecisionsAsRead: () =>
          set(
            (state) => ({
              decisions: state.decisions.map((d) => ({ ...d, read: true })),
              unreadDecisions: 0,
            }),
            false,
            'markAllDecisionsAsRead'
          ),

        // Error actions
        addError: (error) =>
          set(
            (state) => ({
              errors: [error, ...state.errors],
              unresolvedErrors:
                error.resolution === 'unresolved' || error.resolution === 'user_intervention_required'
                  ? state.unresolvedErrors + 1
                  : state.unresolvedErrors,
            }),
            false,
            'addError'
          ),

        updateError: (errorId, updates) =>
          set(
            (state) => {
              const error = state.errors.find((e) => e.errorId === errorId);
              if (!error) return state;

              const wasUnresolved =
                error.resolution === 'unresolved' || error.resolution === 'user_intervention_required';
              const isNowUnresolved =
                updates.resolution === 'unresolved' || updates.resolution === 'user_intervention_required';

              let unresolvedErrors = state.unresolvedErrors;
              if (wasUnresolved && !isNowUnresolved) {
                unresolvedErrors = Math.max(0, unresolvedErrors - 1);
              } else if (!wasUnresolved && isNowUnresolved) {
                unresolvedErrors++;
              }

              return {
                errors: state.errors.map((e) =>
                  e.errorId === errorId ? { ...e, ...updates } : e
                ),
                unresolvedErrors,
              };
            },
            false,
            'updateError'
          ),

        removeError: (errorId) =>
          set(
            (state) => {
              const error = state.errors.find((e) => e.errorId === errorId);
              const wasUnresolved =
                error &&
                (error.resolution === 'unresolved' || error.resolution === 'user_intervention_required');

              return {
                errors: state.errors.filter((e) => e.errorId !== errorId),
                unresolvedErrors: wasUnresolved
                  ? Math.max(0, state.unresolvedErrors - 1)
                  : state.unresolvedErrors,
              };
            },
            false,
            'removeError'
          ),

        // Collaboration actions
        addCollaboration: (collaboration) =>
          set(
            (state) => ({
              collaborations: [...state.collaborations, collaboration],
            }),
            false,
            'addCollaboration'
          ),

        // Preview actions
        setPreview: (previewId, preview) =>
          set(
            (state) => ({
              previews: {
                ...state.previews,
                [previewId]: preview,
              },
            }),
            false,
            'setPreview'
          ),

        removePreview: (previewId) =>
          set(
            (state) => {
              const { [previewId]: removed, ...rest } = state.previews;
              return { previews: rest };
            },
            false,
            'removePreview'
          ),

        // Persona actions
        setPersonas: (personas) => set({ personas }, false, 'setPersonas'),

        updatePersona: (agentType, persona) =>
          set(
            (state) => ({
              personas: {
                ...state.personas,
                [agentType]: persona,
              },
            }),
            false,
            'updatePersona'
          ),

        // Connection actions
        setConnected: (connected) => set({ connected }, false, 'setConnected'),

        setReconnecting: (reconnecting) => set({ reconnecting }, false, 'setReconnecting'),

        // Loading and error actions
        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        // Reset actions
        reset: () => set(initialState, false, 'reset'),

        clearSession: () =>
          set(
            {
              currentSession: null,
              agentStatuses: {},
              decisions: [],
              unreadDecisions: 0,
              errors: [],
              unresolvedErrors: 0,
              collaborations: [],
              previews: {},
            },
            false,
            'clearSession'
          ),
      }),
      {
        name: 'visualization-storage',
        partialize: (state) => ({
          // 只持久化部分状态
          currentSession: state.currentSession,
          personas: state.personas,
        }),
      }
    )
  )
);

// Selectors
export const selectCurrentSession = (state: VisualizationStore) => state.currentSession;
export const selectAgentStatuses = (state: VisualizationStore) => state.agentStatuses;
export const selectDecisions = (state: VisualizationStore) => state.decisions;
export const selectUnreadDecisions = (state: VisualizationStore) => state.unreadDecisions;
export const selectErrors = (state: VisualizationStore) => state.errors;
export const selectUnresolvedErrors = (state: VisualizationStore) => state.unresolvedErrors;
export const selectCollaborations = (state: VisualizationStore) => state.collaborations;
export const selectPreviews = (state: VisualizationStore) => state.previews;
export const selectPersonas = (state: VisualizationStore) => state.personas;
export const selectConnected = (state: VisualizationStore) => state.connected;
export const selectLoading = (state: VisualizationStore) => state.loading;
export const selectError = (state: VisualizationStore) => state.error;
