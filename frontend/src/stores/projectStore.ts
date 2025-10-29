/**
 * Project Store
 *
 * 项目状态管理 - 管理项目列表、当前项目、CRUD操作
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  requirementText: string;
  parsedRequirement?: any;
  status: 'draft' | 'analyzing' | 'ready' | 'building' | 'completed' | 'failed';
  techStack?: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  createdAt: string;
  updatedAt: string;

  // 统计信息
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalAgents: number;
    activeAgents: number;
  };
}

interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Filters and sorting
  filter: 'all' | 'draft' | 'building' | 'completed';
  sortBy: 'createdAt' | 'updatedAt' | 'name';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;

  // Actions - Project CRUD
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  setCurrentProject: (project: Project | null) => void;
  loadProject: (projectId: string) => Promise<void>;

  // Actions - Filters
  setFilter: (filter: 'all' | 'draft' | 'building' | 'completed') => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'name') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;

  // Actions - Loading/Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed/Selectors
  getFilteredProjects: () => Project[];
  getProjectById: (projectId: string) => Project | undefined;

  // Reset
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  filter: 'all' as const,
  sortBy: 'updatedAt' as const,
  sortOrder: 'desc' as const,
  searchQuery: '',
};

export const useProjectStore = create<ProjectStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Project CRUD actions
        setProjects: (projects) =>
          set({ projects }, false, 'setProjects'),

        addProject: (project) =>
          set(
            (state) => ({
              projects: [project, ...state.projects],
            }),
            false,
            'addProject'
          ),

        updateProject: (projectId, updates) =>
          set(
            (state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
              ),
              currentProject:
                state.currentProject?.id === projectId
                  ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
                  : state.currentProject,
            }),
            false,
            'updateProject'
          ),

        deleteProject: (projectId) =>
          set(
            (state) => ({
              projects: state.projects.filter((p) => p.id !== projectId),
              currentProject:
                state.currentProject?.id === projectId ? null : state.currentProject,
            }),
            false,
            'deleteProject'
          ),

        setCurrentProject: (project) =>
          set({ currentProject: project }, false, 'setCurrentProject'),

        loadProject: async (projectId) => {
          set({ loading: true, error: null }, false, 'loadProject:start');

          try {
            // TODO: Replace with actual API call
            const project = get().projects.find((p) => p.id === projectId);

            if (project) {
              set(
                { currentProject: project, loading: false },
                false,
                'loadProject:success'
              );
            } else {
              set(
                { error: '项目不存在', loading: false },
                false,
                'loadProject:notFound'
              );
            }
          } catch (error: any) {
            set(
              { error: error.message, loading: false },
              false,
              'loadProject:error'
            );
          }
        },

        // Filter actions
        setFilter: (filter) => set({ filter }, false, 'setFilter'),

        setSortBy: (sortBy) => set({ sortBy }, false, 'setSortBy'),

        setSortOrder: (sortOrder) => set({ sortOrder }, false, 'setSortOrder'),

        setSearchQuery: (searchQuery) => set({ searchQuery }, false, 'setSearchQuery'),

        // Loading/Error actions
        setLoading: (loading) => set({ loading }, false, 'setLoading'),

        setError: (error) => set({ error }, false, 'setError'),

        // Computed/Selectors
        getFilteredProjects: () => {
          const { projects, filter, sortBy, sortOrder, searchQuery } = get();

          let filtered = [...projects];

          // Apply status filter
          if (filter !== 'all') {
            filtered = filtered.filter((p) => p.status === filter);
          }

          // Apply search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.requirementText.toLowerCase().includes(query)
            );
          }

          // Apply sorting
          filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
              case 'updatedAt':
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
          });

          return filtered;
        },

        getProjectById: (projectId) => {
          return get().projects.find((p) => p.id === projectId);
        },

        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'project-storage',
        partialize: (state) => ({
          // 只持久化部分状态
          currentProject: state.currentProject,
          filter: state.filter,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    )
  )
);

// Selectors
export const selectProjects = (state: ProjectStore) => state.projects;
export const selectCurrentProject = (state: ProjectStore) => state.currentProject;
export const selectLoading = (state: ProjectStore) => state.loading;
export const selectError = (state: ProjectStore) => state.error;
export const selectFilter = (state: ProjectStore) => state.filter;
export const selectFilteredProjects = (state: ProjectStore) => state.getFilteredProjects();
