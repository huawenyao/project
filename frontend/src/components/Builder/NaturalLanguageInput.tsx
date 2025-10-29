/**
 * Natural Language Input Component
 *
 * Sprint 1 - US1: 自然语言应用创建
 * T030: 自然语言输入界面
 */

import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

export interface NaturalLanguageInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  examples?: string[];
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = '描述你想要创建的应用，例如：我需要一个待办事项管理应用...',
  examples = [
    '我需要一个博客平台，支持文章发布、评论和分类',
    '创建一个客户关系管理系统（CRM）',
    '构建一个在线商城，包含商品管理、购物车和支付功能',
  ],
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSubmit(inputText.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setInputText(example);
  };

  const isValid = inputText.trim().length >= 10;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 标题和说明 */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            用自然语言描述你的应用
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          告诉我们你想要什么，AI会为你自动构建应用
        </p>
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative rounded-2xl border-2 transition-all duration-200
            ${
              isFocused
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-gray-300 dark:border-gray-700'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isLoading}
            rows={6}
            className="w-full px-6 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl resize-none focus:outline-none"
          />

          {/* 字符计数 */}
          <div className="absolute bottom-4 left-6 text-sm text-gray-500">
            {inputText.length} / 5000
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`
              absolute bottom-4 right-4 px-6 py-2 rounded-lg font-medium
              flex items-center gap-2 transition-all duration-200
              ${
                isValid && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>开始构建</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 示例 */}
      {!inputText && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            试试这些示例：
          </p>
          <div className="grid gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700
                         hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                         text-sm text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>提示：</strong>
          描述越详细，AI生成的应用越符合你的需求。你可以包括：
          <br />
          • 应用的主要功能
          <br />
          • 目标用户群体
          <br />
          • 需要的数据结构
          <br />• 特殊的业务规则
        </p>
      </div>
    </div>
  );
};

export default NaturalLanguageInput;
