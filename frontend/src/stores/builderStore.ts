/**
 * Builder Store
 *
 * 构建器状态管理 - 管理可视化编辑器的画布、组件、布局等
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface CanvasComponent {
  id: string;
  type: string; // 'Button', 'Input', 'Card', 'Table', etc.
  name: string;
  props: Record<string, any>;
  styles: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    [key: string]: any;
  };
  children?: string[]; // IDs of child components
  parentId?: string;
  dataBinding?: {
    source: string;
    field: string;
  };
  events?: {
    type: string;
    handler: string;
  }[];
}

export interface ComponentLibraryItem {
  type: string;
  category: 'layout' | 'form' | 'data' | 'navigation' | 'feedback';
  name: string;
  icon: string;
  description: string;
  defaultProps: Record<string, any>;
}

export interface HistoryState {
  components: Record<string, CanvasComponent>;
  timestamp: number;
}

interface BuilderStore {
  // Canvas state
  components: Record<string, CanvasComponent>;
  selectedComponentIds: string[];
  hoveredComponentId: string | null;
  rootComponentId: string | null;

  // Component library
  componentLibrary: ComponentLibraryItem[];
  libraryFilter: string;
  libraryCategory: 'all' | 'layout' | 'form' | 'data' | 'navigation' | 'feedback';

  // Canvas settings
  canvasMode: 'design' | 'preview' | 'code';
  canvasZoom: number;
  canvasGrid: boolean;
  canvasSnap: boolean;

  // Drag and drop
  isDragging: boolean;
  draggedComponent: ComponentLibraryItem | CanvasComponent | null;
  dropTarget: string | null;

  // Properties panel
  propertiesPanelTab: 'props' | 'styles' | 'events' | 'data';
  showPropertiesPanel: boolean;

  // History (undo/redo)
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;

  // Loading/Error
  loading: boolean;
  error: string | null;

  // Actions - Component management
  addComponent: (component: CanvasComponent, parentId?: string) => void;
  updateComponent: (componentId: string, updates: Partial<CanvasComponent>) => void;
  deleteComponent: (componentId: string) => void;
  duplicateComponent: (componentId: string) => void;
  moveComponent: (componentId: string, newParentId: string | null, index?: number) => void;

  // Actions - Selection
  selectComponent: (componentId: string, addToSelection?: boolean) => void;
  selectMultiple: (componentIds: string[]) => void;
  clearSelection: () => void;
  setHoveredComponent: (componentId: string | null) => void;

  // Actions - Canvas
  setCanvasMode: (mode: 'design' | 'preview' | 'code') => void;
  setCanvasZoom: (zoom: number) => void;
  toggleCanvasGrid: () => void;
  toggleCanvasSnap: () => void;

  // Actions - Drag and drop
  startDrag: (component: ComponentLibraryItem | CanvasComponent) => void;
  endDrag: () => void;
  setDropTarget: (targetId: string | null) => void;

  // Actions - Properties panel
  setPropertiesPanelTab: (tab: 'props' | 'styles' | 'events' | 'data') => void;
  togglePropertiesPanel: () => void;

  // Actions - Component library
  setLibraryFilter: (filter: string) => void;
  setLibraryCategory: (category: 'all' | 'layout' | 'form' | 'data' | 'navigation' | 'feedback') => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions - Loading/Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getComponent: (componentId: string) => CanvasComponent | undefined;
  getSelectedComponents: () => CanvasComponent[];
  getComponentChildren: (componentId: string) => CanvasComponent[];
  getFilteredLibrary: () => ComponentLibraryItem[];

  // Reset
  reset: () => void;
  loadComponents: (components: Record<string, CanvasComponent>) => void;
}

const initialState = {
  components: {},
  selectedComponentIds: [],
  hoveredComponentId: null,
  rootComponentId: null,

  componentLibrary: [
    // Layout components
    { type: 'Container', category: 'layout' as const, name: '容器', icon: '📦', description: '通用容器组件', defaultProps: {} },
    { type: 'Grid', category: 'layout' as const, name: '网格', icon: '⊞', description: '网格布局', defaultProps: { columns: 2 } },
    { type: 'Flex', category: 'layout' as const, name: '弹性布局', icon: '⇄', description: 'Flexbox布局', defaultProps: { direction: 'row' } },

    // Form components
    { type: 'Input', category: 'form' as const, name: '输入框', icon: '✎', description: '文本输入', defaultProps: { placeholder: '请输入...' } },
    { type: 'Button', category: 'form' as const, name: '按钮', icon: '▭', description: '按钮组件', defaultProps: { text: '按钮' } },
    { type: 'Select', category: 'form' as const, name: '选择器', icon: '▼', description: '下拉选择', defaultProps: { options: [] } },
    { type: 'Checkbox', category: 'form' as const, name: '复选框', icon: '☑', description: '复选框', defaultProps: {} },
    { type: 'Radio', category: 'form' as const, name: '单选框', icon: '◉', description: '单选框组', defaultProps: {} },

    // Data components
    { type: 'Table', category: 'data' as const, name: '表格', icon: '▦', description: '数据表格', defaultProps: { columns: [] } },
    { type: 'List', category: 'data' as const, name: '列表', icon: '☰', description: '列表组件', defaultProps: {} },
    { type: 'Card', category: 'data' as const, name: '卡片', icon: '▭', description: '卡片容器', defaultProps: {} },

    // Navigation components
    { type: 'Navbar', category: 'navigation' as const, name: '导航栏', icon: '≡', description: '顶部导航', defaultProps: {} },
    { type: 'Sidebar', category: 'navigation' as const, name: '侧边栏', icon: '▥', description: '侧边导航', defaultProps: {} },
    { type: 'Tabs', category: 'navigation' as const, name: '标签页', icon: '▤', description: '标签页组件', defaultProps: { tabs: [] } },

    // Feedback components
    { type: 'Alert', category: 'feedback' as const, name: '警告提示', icon: '⚠', description: '警告信息', defaultProps: { type: 'info' } },
    { type: 'Modal', category: 'feedback' as const, name: '模态框', icon: '▢', description: '对话框', defaultProps: {} },
    { type: 'Toast', category: 'feedback' as const, name: '消息提示', icon: '💬', description: '轻提示', defaultProps: {} },
  ],
  libraryFilter: '',
  libraryCategory: 'all' as const,

  canvasMode: 'design' as const,
  canvasZoom: 100,
  canvasGrid: true,
  canvasSnap: true,

  isDragging: false,
  draggedComponent: null,
  dropTarget: null,

  propertiesPanelTab: 'props' as const,
  showPropertiesPanel: true,

  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  loading: false,
  error: null,
};

export const useBuilderStore = create<BuilderStore>()(
  devtools((set, get) => ({
    ...initialState,

    // Component management
    addComponent: (component, parentId) => {
      set(
        (state) => {
          const newComponents = {
            ...state.components,
            [component.id]: {
              ...component,
              parentId: parentId || state.rootComponentId || undefined,
            },
          };

          // Add to parent's children
          if (parentId && newComponents[parentId]) {
            newComponents[parentId] = {
              ...newComponents[parentId],
              children: [...(newComponents[parentId].children || []), component.id],
            };
          }

          return { components: newComponents };
        },
        false,
        'addComponent'
      );
      get().saveToHistory();
    },

    updateComponent: (componentId, updates) => {
      set(
        (state) => ({
          components: {
            ...state.components,
            [componentId]: state.components[componentId]
              ? { ...state.components[componentId], ...updates }
              : state.components[componentId],
          },
        }),
        false,
        'updateComponent'
      );
      get().saveToHistory();
    },

    deleteComponent: (componentId) => {
      set(
        (state) => {
          const component = state.components[componentId];
          if (!component) return state;

          const newComponents = { ...state.components };

          // Remove from parent's children
          if (component.parentId && newComponents[component.parentId]) {
            newComponents[component.parentId] = {
              ...newComponents[component.parentId],
              children: newComponents[component.parentId].children?.filter(
                (id) => id !== componentId
              ),
            };
          }

          // Delete component and all its children recursively
          const deleteRecursive = (id: string) => {
            const comp = newComponents[id];
            if (comp?.children) {
              comp.children.forEach(deleteRecursive);
            }
            delete newComponents[id];
          };

          deleteRecursive(componentId);

          return {
            components: newComponents,
            selectedComponentIds: state.selectedComponentIds.filter((id) => id !== componentId),
          };
        },
        false,
        'deleteComponent'
      );
      get().saveToHistory();
    },

    duplicateComponent: (componentId) => {
      const component = get().components[componentId];
      if (!component) return;

      const newId = `${component.type}_${Date.now()}`;
      const duplicated: CanvasComponent = {
        ...component,
        id: newId,
        name: `${component.name} (副本)`,
        styles: {
          ...component.styles,
          position: component.styles.position
            ? {
                x: component.styles.position.x + 20,
                y: component.styles.position.y + 20,
              }
            : undefined,
        },
      };

      get().addComponent(duplicated, component.parentId);
    },

    moveComponent: (componentId, newParentId, index) => {
      set(
        (state) => {
          const component = state.components[componentId];
          if (!component) return state;

          const newComponents = { ...state.components };

          // Remove from old parent
          if (component.parentId && newComponents[component.parentId]) {
            newComponents[component.parentId] = {
              ...newComponents[component.parentId],
              children: newComponents[component.parentId].children?.filter(
                (id) => id !== componentId
              ),
            };
          }

          // Update component
          newComponents[componentId] = {
            ...component,
            parentId: newParentId || undefined,
          };

          // Add to new parent
          if (newParentId && newComponents[newParentId]) {
            const children = [...(newComponents[newParentId].children || [])];
            if (index !== undefined) {
              children.splice(index, 0, componentId);
            } else {
              children.push(componentId);
            }
            newComponents[newParentId] = {
              ...newComponents[newParentId],
              children,
            };
          }

          return { components: newComponents };
        },
        false,
        'moveComponent'
      );
      get().saveToHistory();
    },

    // Selection
    selectComponent: (componentId, addToSelection = false) =>
      set(
        (state) => ({
          selectedComponentIds: addToSelection
            ? [...state.selectedComponentIds, componentId]
            : [componentId],
        }),
        false,
        'selectComponent'
      ),

    selectMultiple: (componentIds) =>
      set({ selectedComponentIds: componentIds }, false, 'selectMultiple'),

    clearSelection: () => set({ selectedComponentIds: [] }, false, 'clearSelection'),

    setHoveredComponent: (componentId) =>
      set({ hoveredComponentId: componentId }, false, 'setHoveredComponent'),

    // Canvas
    setCanvasMode: (mode) => set({ canvasMode: mode }, false, 'setCanvasMode'),

    setCanvasZoom: (zoom) =>
      set({ canvasZoom: Math.max(25, Math.min(200, zoom)) }, false, 'setCanvasZoom'),

    toggleCanvasGrid: () =>
      set((state) => ({ canvasGrid: !state.canvasGrid }), false, 'toggleCanvasGrid'),

    toggleCanvasSnap: () =>
      set((state) => ({ canvasSnap: !state.canvasSnap }), false, 'toggleCanvasSnap'),

    // Drag and drop
    startDrag: (component) =>
      set({ isDragging: true, draggedComponent: component }, false, 'startDrag'),

    endDrag: () =>
      set({ isDragging: false, draggedComponent: null, dropTarget: null }, false, 'endDrag'),

    setDropTarget: (targetId) => set({ dropTarget: targetId }, false, 'setDropTarget'),

    // Properties panel
    setPropertiesPanelTab: (tab) => set({ propertiesPanelTab: tab }, false, 'setPropertiesPanelTab'),

    togglePropertiesPanel: () =>
      set(
        (state) => ({ showPropertiesPanel: !state.showPropertiesPanel }),
        false,
        'togglePropertiesPanel'
      ),

    // Component library
    setLibraryFilter: (filter) => set({ libraryFilter: filter }, false, 'setLibraryFilter'),

    setLibraryCategory: (category) => set({ libraryCategory: category }, false, 'setLibraryCategory'),

    // History
    saveToHistory: () =>
      set(
        (state) => {
          const newHistoryState: HistoryState = {
            components: state.components,
            timestamp: Date.now(),
          };

          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newHistoryState);

          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }

          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        },
        false,
        'saveToHistory'
      ),

    undo: () =>
      set(
        (state) => {
          if (state.historyIndex > 0) {
            const prevState = state.history[state.historyIndex - 1];
            return {
              components: prevState.components,
              historyIndex: state.historyIndex - 1,
            };
          }
          return state;
        },
        false,
        'undo'
      ),

    redo: () =>
      set(
        (state) => {
          if (state.historyIndex < state.history.length - 1) {
            const nextState = state.history[state.historyIndex + 1];
            return {
              components: nextState.components,
              historyIndex: state.historyIndex + 1,
            };
          }
          return state;
        },
        false,
        'redo'
      ),

    canUndo: () => get().historyIndex > 0,

    canRedo: () => get().historyIndex < get().history.length - 1,

    // Loading/Error
    setLoading: (loading) => set({ loading }, false, 'setLoading'),

    setError: (error) => set({ error }, false, 'setError'),

    // Getters
    getComponent: (componentId) => get().components[componentId],

    getSelectedComponents: () => {
      const { components, selectedComponentIds } = get();
      return selectedComponentIds
        .map((id) => components[id])
        .filter((c): c is CanvasComponent => !!c);
    },

    getComponentChildren: (componentId) => {
      const { components } = get();
      const component = components[componentId];
      if (!component?.children) return [];

      return component.children
        .map((id) => components[id])
        .filter((c): c is CanvasComponent => !!c);
    },

    getFilteredLibrary: () => {
      const { componentLibrary, libraryFilter, libraryCategory } = get();

      let filtered = componentLibrary;

      // Filter by category
      if (libraryCategory !== 'all') {
        filtered = filtered.filter((item) => item.category === libraryCategory);
      }

      // Filter by search query
      if (libraryFilter) {
        const query = libraryFilter.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
      }

      return filtered;
    },

    // Reset
    reset: () => set(initialState, false, 'reset'),

    loadComponents: (components) => {
      set({ components }, false, 'loadComponents');
      get().saveToHistory();
    },
  }))
);

// Selectors
export const selectComponents = (state: BuilderStore) => state.components;
export const selectSelectedComponents = (state: BuilderStore) => state.getSelectedComponents();
export const selectCanvasMode = (state: BuilderStore) => state.canvasMode;
export const selectIsDragging = (state: BuilderStore) => state.isDragging;
export const selectFilteredLibrary = (state: BuilderStore) => state.getFilteredLibrary();
