/**
 * Visual Editor Component
 *
 * Phase 2 Week 3-4 - 可视化编辑器
 * 支持拖放、组件管理、实时预览
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useBuilderStore, type CanvasComponent } from '../../stores/builderStore';
import {
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Maximize2,
  Eye,
  Code,
  Undo2,
  Redo2,
  Save,
} from 'lucide-react';

interface VisualEditorProps {
  onSave?: () => void;
  className?: string;
}

const ITEM_TYPE = 'COMPONENT';

/**
 * 可拖放的画布组件
 */
const DroppableCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { components, addComponent, draggedComponent, endDrag } = useBuilderStore();

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: any, monitor) => {
      if (!draggedComponent) return;

      const offset = monitor.getClientOffset();
      if (!offset) return;

      // 从组件库拖入的新组件
      if ('type' in draggedComponent && !('id' in draggedComponent)) {
        const newComponent: CanvasComponent = {
          id: `${draggedComponent.type}_${Date.now()}`,
          type: draggedComponent.type,
          name: draggedComponent.name,
          props: draggedComponent.defaultProps || {},
          styles: {
            position: { x: offset.x - 200, y: offset.y - 100 },
            size: { width: 200, height: 100 },
          },
        };
        addComponent(newComponent);
      }

      endDrag();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        relative w-full h-full bg-gray-50 dark:bg-gray-900
        ${isOver ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
      `}
    >
      {children}
    </div>
  );
};

/**
 * 画布上的组件实例
 */
const CanvasComponentInstance: React.FC<{
  component: CanvasComponent;
}> = ({ component }) => {
  const {
    selectedComponentIds,
    hoveredComponentId,
    selectComponent,
    setHoveredComponent,
    updateComponent,
  } = useBuilderStore();

  const isSelected = selectedComponentIds.includes(component.id);
  const isHovered = hoveredComponentId === component.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(component.id, e.shiftKey);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHoveredComponent(component.id)}
      onMouseLeave={() => setHoveredComponent(null)}
      className={`
        absolute border-2 transition-all cursor-move
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : isHovered
            ? 'border-gray-400'
            : 'border-gray-300 dark:border-gray-700'
        }
        hover:shadow-lg
      `}
      style={{
        left: component.styles.position?.x || 0,
        top: component.styles.position?.y || 0,
        width: component.styles.size?.width || 200,
        height: component.styles.size?.height || 100,
      }}
    >
      {/* 组件内容 */}
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <div className="text-2xl mb-2">
          {component.type === 'Button' && '🔘'}
          {component.type === 'Input' && '📝'}
          {component.type === 'Card' && '🎴'}
          {component.type === 'Table' && '📊'}
          {component.type === 'Container' && '📦'}
          {component.type === 'Grid' && '⊞'}
          {component.type === 'Flex' && '⇄'}
        </div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {component.name}
        </div>
        <div className="text-xs text-gray-500">{component.type}</div>
      </div>

      {/* 选中状态的调整手柄 */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
};

/**
 * 主编辑器组件
 */
export const VisualEditor: React.FC<VisualEditorProps> = ({
  onSave,
  className = '',
}) => {
  const {
    components,
    canvasMode,
    canvasZoom,
    canvasGrid,
    setCanvasMode,
    setCanvasZoom,
    toggleCanvasGrid,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBuilderStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, onSave]);

  const handleCanvasClick = () => {
    clearSelection();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`flex flex-col h-full ${className}`}>
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* 左侧工具 */}
          <div className="flex items-center gap-2">
            {/* 模式切换 */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setCanvasMode('design')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${
                    canvasMode === 'design'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                设计
              </button>
              <button
                onClick={() => setCanvasMode('preview')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1
                  ${
                    canvasMode === 'preview'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Eye className="w-4 h-4" />
                预览
              </button>
              <button
                onClick={() => setCanvasMode('code')}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1
                  ${
                    canvasMode === 'code'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Code className="w-4 h-4" />
                代码
              </button>
            </div>

            {/* 撤销/重做 */}
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="撤销 (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="重做 (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* 缩放控制 */}
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
              <button
                onClick={() => setCanvasZoom(canvasZoom - 10)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[50px] text-center">
                {canvasZoom}%
              </span>
              <button
                onClick={() => setCanvasZoom(canvasZoom + 10)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCanvasZoom(100)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="重置缩放"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* 网格切换 */}
            <button
              onClick={toggleCanvasGrid}
              className={`
                p-2 rounded transition-colors
                ${
                  canvasGrid
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              title="切换网格"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>

          {/* 右侧工具 */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                       flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 overflow-auto" onClick={handleCanvasClick}>
          <DroppableCanvas>
            <div
              ref={canvasRef}
              className={`
                relative min-w-full min-h-full
                ${canvasGrid ? 'bg-grid-pattern' : ''}
              `}
              style={{
                transform: `scale(${canvasZoom / 100})`,
                transformOrigin: 'top left',
                width: `${10000 * (100 / canvasZoom)}px`,
                height: `${10000 * (100 / canvasZoom)}px`,
              }}
            >
              {/* 渲染所有组件 */}
              {Object.values(components).map((component) => (
                <CanvasComponentInstance key={component.id} component={component} />
              ))}

              {/* 空状态 */}
              {Object.keys(components).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400 dark:text-gray-600">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-lg font-medium mb-2">从左侧拖入组件开始设计</p>
                    <p className="text-sm">或使用AI自然语言生成界面</p>
                  </div>
                </div>
              )}
            </div>
          </DroppableCanvas>
        </div>

        {/* 状态栏 */}
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <div>
              组件数: {Object.keys(components).length} | 已选择:{' '}
              {useBuilderStore.getState().selectedComponentIds.length}
            </div>
            <div>模式: {canvasMode} | 缩放: {canvasZoom}%</div>
          </div>
        </div>
      </div>

      {/* 网格背景样式 */}
      <style>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(156, 163, 175, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(156, 163, 175, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </DndProvider>
  );
};

export default VisualEditor;
