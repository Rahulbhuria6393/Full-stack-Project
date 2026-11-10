import { useState } from 'react';
import { CheckCircle2, Clock, Lock, Terminal, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function VerdictPanel({ evaluation, mode, loading }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>Running code inside sandboxed executor (3s timeout limit)...</span>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400 flex items-center gap-2.5">
        <Terminal className="h-4 w-4 text-slate-500" />
        <span>Click <strong>Run</strong> to test visible samples or <strong>Submit</strong> to grade all test cases.</span>
      </div>
    );
  }

  const results = evaluation.results || [];
  const activeCase = results[selectedIdx] || results[0];

  return (
    <div
      data-testid="verdict-panel"
      className="rounded-xl border border-slate-800 bg-slate-900/95 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900">
        <div className="flex items-center gap-3">
          <StatusBadge status={evaluation.status} />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {mode === 'submit' ? 'Submission Verdict' : 'Run Output'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
          <span>
            Passed:{' '}
            <strong className="text-white">
              {evaluation.passedTests}/{evaluation.totalTests}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <strong>{evaluation.runtimeMs} ms</strong>
          </span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {results.map((r, idx) => {
              const isSelected = idx === (results[selectedIdx] ? selectedIdx : 0);
              return (
                <button
                  key={r.testCaseNumber}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/60 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>Case {r.testCaseNumber}</span>
                  {r.isHidden && <Lock className="h-3 w-3 text-slate-500" />}
                </button>
              );
            })}
          </div>

          {activeCase && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Test Case #{activeCase.testCaseNumber}{' '}
                  {activeCase.isHidden ? '(Hidden)' : '(Sample)'}
                </span>
                <span className="font-mono">{activeCase.runtimeMs} ms</span>
              </div>

              {activeCase.stderr && (
                <div>
                  <div className="text-xs font-semibold text-rose-300 mb-1">Stderr / Error</div>
                  <pre className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs font-mono text-rose-200 whitespace-pre-wrap overflow-x-auto">
                    {activeCase.stderr}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">Input</div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap break-all min-h-[52px]">
                    {activeCase.input || '(empty)'}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">Expected Output</div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 whitespace-pre-wrap break-all min-h-[52px]">
                    {activeCase.expectedOutput ?? '(custom input)'}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-400 mb-1">Your Output</div>
                  <pre
                    className={`p-2.5 rounded-lg bg-slate-950 border text-xs font-mono whitespace-pre-wrap break-all min-h-[52px] ${
                      activeCase.passed
                        ? 'border-emerald-500/30 text-emerald-300'
                        : 'border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {activeCase.actualOutput || '(no stdout)'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
