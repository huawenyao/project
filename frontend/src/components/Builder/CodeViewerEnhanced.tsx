/**
 * Enhanced Code Viewer Component with Monaco Editor
 *
 * Phase 8 - T091-T094: 增强代码查看器
 * - T091: 创建 CodeViewer 组件
 * - T092: 集成 Monaco Editor
 * - T093: 实现语法高亮和代码导航
 * - T094: 实现优化建议标注和详情展示
 */

import React, { useState, useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Code,
  FileCode,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  Settings,
  Eye,
  EyeOff,
  Lightbulb,
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface CodeIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedFix?: string;
}

export interface OptimizationSuggestion {
  id: string;
  line: number;
  category: 'performance' | 'security' | 'maintainability';
  impact: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  before: string;
  after: string;
  benefit: string;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  issues?: CodeIssue[];
  suggestions?: OptimizationSuggestion[];
}

export interface CodeViewerEnhancedProps {
  files: CodeFile[];
  onFileSelect?: (file: CodeFile) => void;
  onCopy?: (content: string) => void;
  onDownload?: (file: CodeFile) => void;
  onApplySuggestion?: (suggestion: OptimizationSuggestion) => void;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
}

export const CodeViewerEnhanced: React.FC<CodeViewerEnhancedProps> = ({
  files,
  onFileSelect,
  onCopy,
  onDownload,
  onApplySuggestion,
  readOnly = true,
  theme = 'light',
}) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(
    files.length > 0 ? files[0] : null
  );
  const [editorTheme, setEditorTheme] = useState<'light' | 'vs-dark'>(
    theme === 'dark' ? 'vs-dark' : 'light'
  );
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    if (selectedFile && editorRef.current && monacoRef.current) {
      // 添加问题标记
      addIssueMarkers();
      // 添加优化建议装饰
      addSuggestionDecorations();
    }
  }, [selectedFile]);

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      toast.success('代码已复制到剪贴板');
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
      toast.success('文件下载成功');
      onDownload?.(selectedFile);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 配置编辑器
    editor.updateOptions({
      minimap: { enabled: showMinimap },
      fontSize: fontSize,
      readOnly: readOnly,
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'actions.find');
    });

    addIssueMarkers();
    addSuggestionDecorations();
  };

  const addIssueMarkers = () => {
    if (!selectedFile || !editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) return;

    const markers = (selectedFile.issues || []).map((issue) => ({
      startLineNumber: issue.line,
      startColumn: issue.column || 1,
      endLineNumber: issue.line,
      endColumn: model.getLineMaxColumn(issue.line),
      message: issue.message,
      severity:
        issue.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : issue.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    }));

    monaco.editor.setModelMarkers(model, 'issues', markers);
  };

  const addSuggestionDecorations = () => {
    if (!selectedFile || !editorRef.current || !showSuggestions) return;

    const editor = editorRef.current;
    const suggestions = selectedFile.suggestions || [];

    const decorations = suggestions.map((suggestion) => ({
      range: {
        startLineNumber: suggestion.line,
        startColumn: 1,
        endLineNumber: suggestion.line,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: 'suggestion-line',
        glyphMarginClassName: 'suggestion-glyph',
        glyphMarginHoverMessage: { value: suggestion.title },
        hoverMessage: { value: `💡 ${suggestion.title}\n\n${suggestion.description}` },
      },
    }));

    editor.deltaDecorations([], decorations);
  };

  const handleSearch = () => {
    if (!editorRef.current || !searchQuery) return;

    editorRef.current.trigger('', 'actions.find', {
      searchString: searchQuery,
    });
  };

  const handleZoomIn = () => {
    setFontSize((prev) => Math.min(prev + 2, 32));
    editorRef.current?.updateOptions({ fontSize: fontSize + 2 });
  };

  const handleZoomOut = () => {
    setFontSize((prev) => Math.max(prev - 2, 8));
    editorRef.current?.updateOptions({ fontSize: fontSize - 2 });
  };

  const toggleMinimap = () => {
    setShowMinimap(!showMinimap);
    editorRef.current?.updateOptions({ minimap: { enabled: !showMinimap } });
  };

  const toggleTheme = () => {
    const newTheme = editorTheme === 'light' ? 'vs-dark' : 'light';
    setEditorTheme(newTheme);
  };

  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // 在建议的行替换代码
    const lineContent = model.getLineContent(suggestion.line);
    const range = {
      startLineNumber: suggestion.line,
      startColumn: 1,
      endLineNumber: suggestion.line,
      endColumn: lineContent.length + 1,
    };

    editor.executeEdits('apply-suggestion', [
      {
        range,
        text: suggestion.after,
      },
    ]);

    toast.success('优化建议已应用');
    onApplySuggestion?.(suggestion);
    setSelectedSuggestion(null);
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
      json: 'JSON',
      css: 'CSS',
      html: 'HTML',
    };
    return labels[lang] || lang.toUpperCase();
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            代码查看器
          </h3>
          {selectedFile && (
            <span className="text-sm text-gray-500">
              {getLanguageLabel(selectedFile.language)}
            </span>
          )}
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2">
            {/* 搜索 */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索..."
                className="bg-transparent border-none outline-none text-sm py-1 w-32"
              />
            </div>

            {/* 缩放 */}
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="缩小">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">{fontSize}px</span>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="放大">
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* 小地图切换 */}
            <button onClick={toggleMinimap} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title={showMinimap ? "隐藏小地图" : "显示小地图"}>
              {showMinimap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* 主题切换 */}
            <button onClick={toggleTheme} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="切换主题">
              <Settings className="w-4 h-4" />
            </button>

            {/* 操作按钮 */}
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="复制代码">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="下载文件">
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 文件列表 */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <div className="p-2">
            {files.map((file, index) => {
              const issueCount = file.issues?.length || 0;
              const suggestionCount = file.suggestions?.length || 0;
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
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.path.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getLanguageLabel(file.language)}
                    </span>
                    {issueCount > 0 && (
                      <span
                        className={`
                          flex items-center gap-1 text-xs px-1.5 py-0.5 rounded
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
                    {suggestionCount > 0 && (
                      <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Lightbulb className="w-3 h-3" />
                        {suggestionCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 flex overflow-hidden">
          {selectedFile ? (
            <div className="flex-1 flex flex-col">
              {/* 文件路径 */}
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

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={selectedFile.language}
                  value={selectedFile.content}
                  theme={editorTheme}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly,
                    minimap: { enabled: showMinimap },
                    fontSize,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">选择一个文件查看代码</p>
              </div>
            </div>
          )}

          {/* 优化建议侧边栏 */}
          {selectedFile && selectedFile.suggestions && selectedFile.suggestions.length > 0 && showSuggestions && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    优化建议
                  </h4>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedFile.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${getImpactColor(suggestion.impact)}`}>
                            {suggestion.impact}
                          </span>
                          <span className="text-xs text-gray-500">Line {suggestion.line}</span>
                        </div>
                      </div>
                      <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                        {suggestion.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ✓ {suggestion.benefit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 建议详情 Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedSuggestion.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getImpactColor(selectedSuggestion.impact)}`}>
                    {selectedSuggestion.impact} impact
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedSuggestion.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedSuggestion.description}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  当前代码
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                  <code>{selectedSuggestion.before}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  优化后代码
                </h4>
                <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm overflow-x-auto">
                  <code>{selectedSuggestion.after}</code>
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  收益
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {selectedSuggestion.benefit}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleApplySuggestion(selectedSuggestion)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                应用建议
              </button>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeViewerEnhanced;
