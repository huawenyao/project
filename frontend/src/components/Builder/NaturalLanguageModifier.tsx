/**
 * Natural Language Modifier
 * T060: 自然语言修改命令解析和执行
 */

import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { useBuilderStore } from '../../stores/builderStore';

export interface NaturalLanguageModifierProps {
  projectId: string;
  className?: string;
}

export const NaturalLanguageModifier: React.FC<NaturalLanguageModifierProps> = ({
  projectId,
  className = '',
}) => {
  const { components, updateComponent, addComponent, deleteComponent } = useBuilderStore();
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ command: string; result: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!command.trim() || loading) return;

    setLoading(true);

    try {
      // TODO: 调用后端 API 解析命令
      const response = await fetch(`/api/builder/parse-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          command,
          currentComponents: Object.values(components),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { action, targetId, targetType, modifications } = result.data;

        // 执行修改操作
        switch (action) {
          case 'add':
            if (targetType && modifications) {
              addComponent({
                id: `${targetType}_${Date.now()}`,
                type: targetType,
                name: modifications.name || targetType,
                props: modifications.props || {},
                styles: modifications.styles || {},
              });
            }
            break;

          case 'update':
            if (targetId && modifications) {
              updateComponent(targetId, modifications);
            }
            break;

          case 'delete':
            if (targetId) {
              deleteComponent(targetId);
            }
            break;

          case 'style':
          case 'move':
            if (targetId && modifications) {
              updateComponent(targetId, { styles: modifications.styles });
            }
            break;
        }

        setHistory([
          ...history,
          {
            command,
            result: `成功: ${result.data.reasoning || '已执行'}`,
          },
        ]);
      } else {
        setHistory([
          ...history,
          { command, result: `失败: ${result.error || '未知错误'}` },
        ]);
      }

      setCommand('');
    } catch (error: any) {
      setHistory([
        ...history,
        { command, result: `错误: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            AI 自然语言修改
          </h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          用自然语言描述您想要的修改
        </p>
      </div>

      {/* 历史记录 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm">尝试一些命令：</p>
            <div className="mt-3 space-y-2 text-xs">
              <p className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                &quot;添加一个登录按钮到页面顶部&quot;
              </p>
              <p className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                &quot;把标题文字改成蓝色&quot;
              </p>
              <p className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                &quot;删除第一个输入框&quot;
              </p>
            </div>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {item.command}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {item.result}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="描述您想要的修改..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !command.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     flex items-center gap-2 font-medium transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                处理中
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                执行
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NaturalLanguageModifier;
