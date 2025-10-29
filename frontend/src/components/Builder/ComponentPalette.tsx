/**
 * Component Palette
 *
 * Phase 2 Week 3-4 - 组件库面板
 * 可拖拽的组件库，支持分类和搜索
 */

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { useBuilderStore, type ComponentLibraryItem } from '../../stores/builderStore';
import { Search, X } from 'lucide-react';

const ITEM_TYPE = 'COMPONENT';

/**
 * 可拖拽的组件项
 */
const DraggableComponentItem: React.FC<{
  item: ComponentLibraryItem;
}> = ({ item }) => {
  const { startDrag, endDrag } = useBuilderStore();

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      startDrag(item);
      return item;
    },
    end: () => {
      endDrag();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-lg cursor-move hover:shadow-lg hover:border-blue-500
        transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl">{item.icon}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
          {item.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {item.description}
        </div>
      </div>
    </div>
  );
};

/**
 * 组件库面板主组件
 */
export interface ComponentPaletteProps {
  className?: string;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  className = '',
}) => {
  const {
    libraryFilter,
    libraryCategory,
    setLibraryFilter,
    setLibraryCategory,
    getFilteredLibrary,
  } = useBuilderStore();

  const filteredComponents = getFilteredLibrary();

  const categories = [
    { id: 'all', name: '全部', icon: '📦' },
    { id: 'layout', name: '布局', icon: '⊞' },
    { id: 'form', name: '表单', icon: '📝' },
    { id: 'data', name: '数据', icon: '📊' },
    { id: 'navigation', name: '导航', icon: '🧭' },
    { id: 'feedback', name: '反馈', icon: '💬' },
  ];

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* 标题 */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          组件库
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          拖拽组件到画布
        </p>
      </div>

      {/* 搜索框 */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
            placeholder="搜索组件..."
            className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600
                     rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {libraryFilter && (
            <button
              onClick={() => setLibraryFilter('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setLibraryCategory(
                  cat.id as 'all' | 'layout' | 'form' | 'data' | 'navigation' | 'feedback'
                )
              }
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                flex items-center gap-1
                ${
                  libraryCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 组件列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredComponents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">未找到匹配的组件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredComponents.map((item, index) => (
              <DraggableComponentItem key={`${item.type}-${index}`} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>提示：</strong>拖拽组件到画布中即可添加
        </p>
      </div>
    </div>
  );
};

export default ComponentPalette;
