/**
 * Property Panel
 *
 * Phase 2 Week 3-4 - 属性编辑面板
 * 编辑选中组件的属性、样式和事件
 */

import React, { useState } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { Trash2, Copy, Settings, Palette, Zap } from 'lucide-react';

export interface PropertyPanelProps {
  className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ className = '' }) => {
  const {
    getSelectedComponents,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    propertiesPanelTab,
    setPropertiesPanelTab,
  } = useBuilderStore();

  const selectedComponents = getSelectedComponents();
  const selectedComponent = selectedComponents.length === 1 ? selectedComponents[0] : null;

  if (!selectedComponent) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8 ${className}`}
      >
        <div className="text-gray-400 dark:text-gray-600 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg font-medium mb-2">选择一个组件</p>
          <p className="text-sm">在画布中点击组件以编辑其属性</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'props', label: '属性', icon: <Settings className="w-4 h-4" /> },
    { id: 'styles', label: '样式', icon: <Palette className="w-4 h-4" /> },
    { id: 'events', label: '事件', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* 标题和操作 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedComponent.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedComponent.type}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => duplicateComponent(selectedComponent.id)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="复制组件"
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => deleteComponent(selectedComponent.id)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="删除组件"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setPropertiesPanelTab(tab.id as 'props' | 'styles' | 'events' | 'data')
              }
              className={`
                flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
                flex items-center justify-center gap-2
                ${
                  propertiesPanelTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-blue-600 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {propertiesPanelTab === 'props' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                组件名称
              </label>
              <input
                type="text"
                value={selectedComponent.name}
                onChange={(e) =>
                  updateComponent(selectedComponent.id, { name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 组件特定属性 */}
            {selectedComponent.type === 'Button' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  按钮文本
                </label>
                <input
                  type="text"
                  value={selectedComponent.props.text || '按钮'}
                  onChange={(e) =>
                    updateComponent(selectedComponent.id, {
                      props: { ...selectedComponent.props, text: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {selectedComponent.type === 'Input' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  占位符
                </label>
                <input
                  type="text"
                  value={selectedComponent.props.placeholder || ''}
                  onChange={(e) =>
                    updateComponent(selectedComponent.id, {
                      props: { ...selectedComponent.props, placeholder: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {propertiesPanelTab === 'styles' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                位置
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    type="number"
                    value={selectedComponent.styles.position?.x || 0}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        styles: {
                          ...selectedComponent.styles,
                          position: {
                            ...selectedComponent.styles.position,
                            x: parseInt(e.target.value),
                            y: selectedComponent.styles.position?.y || 0,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    type="number"
                    value={selectedComponent.styles.position?.y || 0}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        styles: {
                          ...selectedComponent.styles,
                          position: {
                            ...selectedComponent.styles.position,
                            x: selectedComponent.styles.position?.x || 0,
                            y: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                尺寸
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">宽度</label>
                  <input
                    type="number"
                    value={selectedComponent.styles.size?.width || 200}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        styles: {
                          ...selectedComponent.styles,
                          size: {
                            ...selectedComponent.styles.size,
                            width: parseInt(e.target.value),
                            height: selectedComponent.styles.size?.height || 100,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">高度</label>
                  <input
                    type="number"
                    value={selectedComponent.styles.size?.height || 100}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        styles: {
                          ...selectedComponent.styles,
                          size: {
                            ...selectedComponent.styles.size,
                            width: selectedComponent.styles.size?.width || 200,
                            height: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {propertiesPanelTab === 'events' && (
          <div className="space-y-4">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">事件处理功能即将推出</p>
              <p className="text-xs mt-2">
                将支持 onClick, onChange, onSubmit 等事件
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 提示 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>快捷键：</strong> Del删除 | Ctrl+D复制
        </p>
      </div>
    </div>
  );
};

export default PropertyPanel;
