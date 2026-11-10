import { Component } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { RotateCcw } from 'lucide-react';

if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
}

loader.config({ monaco });

class MonacoErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function CodeEditorPanel({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onReset,
}) {
  const fallbackTextarea = (
    <textarea
      data-testid="fallback-code-editor"
      value={code}
      onChange={(e) => onCodeChange(e.target.value)}
      spellCheck={false}
      className="w-full h-full min-h-[360px] bg-slate-950 text-slate-100 font-mono text-sm p-4 focus:outline-none resize-none"
    />
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <label htmlFor="language-select" className="text-xs font-medium text-slate-400">
            Language
          </label>
          <select
            id="language-select"
            data-testid="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-slate-950 text-slate-100 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Reset to starter template"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Code
        </button>
      </div>

      <div className="flex-1 min-h-[360px] bg-slate-950" data-testid="code-editor-container">
        <MonacoErrorBoundary fallback={fallbackTextarea}>
          <Editor
            height="100%"
            language={language === 'python' ? 'python' : 'javascript'}
            theme="vs-dark"
            value={code}
            onChange={(value) => onCodeChange(value ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 14, bottom: 14 },
              smoothScrolling: true,
            }}
          />
        </MonacoErrorBoundary>
      </div>
    </div>
  );
}
