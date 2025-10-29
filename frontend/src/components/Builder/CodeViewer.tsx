/**
 * Code Viewer Component
 *
 * Sprint 5 - US6: 智能代码审查与优化建议
 * T091: 代码查看器
 */

import React, { useState } from 'react';
import { Code, FileCode, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  issues?: Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
}

export interface CodeViewerProps {
  files: CodeFile[];
  onFileSelect?: (file: CodeFile) => void;
  onCopy?: (content: string) => void;
  onDownload?: (file: CodeFile) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  files,
  onFileSelect,
  onCopy,
  onDownload,
}) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(
    files.length > 0 ? files[0] : null
  );

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      onCopy?.(selectedFile.content);
    }
  };

  const handleDownload = () => {
    if (selectedFile) {
      const blob = new Blob([selectedFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.path.split('/').pop() || 'code.txt';
      a.click();
      URL.revokeObjectURL(url);
      onDownload?.(selectedFile);
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      tsx: 'React TSX',
      jsx: 'React JSX',
      python: 'Python',
      java: 'Java',
      go: 'Go',
      rust: 'Rust',
    };
    return labels[lang] || lang.toUpperCase();
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            生成的代码
          </h3>
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="复制代码"
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="下载文件"
            >
              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 文件列表侧边栏 */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-2">
            {files.map((file, index) => {
              const issueCount = file.issues?.length || 0;
              const hasErrors = file.issues?.some((i) => i.severity === 'error');

              return (
                <button
                  key={index}
                  onClick={() => handleFileSelect(file)}
                  className={`
                    w-full text-left p-3 rounded-lg mb-1 transition-colors
                    ${
                      selectedFile === file
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.path.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getLanguageLabel(file.language)}
                    </span>
                    {issueCount > 0 && (
                      <span
                        className={`
                          flex items-center gap-1 text-xs px-1 py-0.5 rounded
                          ${
                            hasErrors
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }
                        `}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {issueCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 代码显示区域 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              {/* 文件头 */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {selectedFile.path}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedFile.content.split('\n').length} 行
                  </span>
                </div>
              </div>

              {/* 问题提示 */}
              {selectedFile.issues && selectedFile.issues.length > 0 && (
                <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      发现 {selectedFile.issues.length} 个问题
                    </span>
                  </div>
                </div>
              )}

              {/* 代码内容 */}
              <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                <pre className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>选择一个文件查看代码</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
