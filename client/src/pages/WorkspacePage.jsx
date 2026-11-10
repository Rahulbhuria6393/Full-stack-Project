import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Play,
  Send,
  Terminal,
  Users,
} from 'lucide-react';
import { problemsApi, submissionsApi } from '../api/client';
import CodeEditorPanel from '../components/CodeEditorPanel';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';
import VerdictPanel from '../components/VerdictPanel';
import { useAuth } from '../context/AuthContext';

const DEFAULT_STARTER = {
  javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();

// Write your solution here
console.log(input);`,
  python: `import sys
data = sys.stdin.read().strip()

# Write your solution here
print(data)`,
};

function renderFormattedText(text) {
  if (!text) return null;
  return text.split('\n').map((line, index) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-sm font-semibold text-white mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={index} className="ml-4 list-disc text-sm text-slate-300 leading-relaxed">
          <InlineCodeText text={line.slice(2)} />
        </li>
      );
    }
    if (line.trim() === '') {
      return <div key={index} className="h-2" />;
    }
    return (
      <p key={index} className="text-sm text-slate-300 leading-relaxed">
        <InlineCodeText text={line} />
      </p>
    );
  });
}

function InlineCodeText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function WorkspacePage() {
  const { id } = useParams();
  const { isInstructor } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [error, setError] = useState('');

  const [language, setLanguage] = useState('javascript');
  const [codeByLang, setCodeByLang] = useState({ javascript: '', python: '' });

  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const [running, setRunning] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [verdictMode, setVerdictMode] = useState('run');

  const [leftTab, setLeftTab] = useState('description');
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProblem = async () => {
      setLoadingProblem(true);
      setError('');
      setEvaluation(null);
      try {
        const res = await problemsApi.getById(id);
        if (!active) return;
        const p = res.problem;
        setProblem(p);
        setCodeByLang({
          javascript: p.starterCode?.javascript || DEFAULT_STARTER.javascript,
          python: p.starterCode?.python || DEFAULT_STARTER.python,
        });
        setCustomInput(p.sampleInput || '');
      } catch (err) {
        if (active) setError(err.message || 'Failed to load problem');
      } finally {
        if (active) setLoadingProblem(false);
      }
    };
    loadProblem();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isInstructor || leftTab !== 'submissions' || !id) return;
    let active = true;
    const loadSubs = async () => {
      setLoadingSubs(true);
      try {
        const res = await submissionsApi.byProblem(id);
        if (active) setStudentSubmissions(res.submissions || []);
      } catch {
        // Handled quietly
      } finally {
        if (active) setLoadingSubs(false);
      }
    };
    loadSubs();
    return () => {
      active = false;
    };
  }, [id, isInstructor, leftTab]);

  const currentCode = codeByLang[language] ?? '';

  const handleCodeChange = (nextCode) => {
    setCodeByLang((prev) => ({ ...prev, [language]: nextCode }));
  };

  const handleReset = () => {
    if (!problem) return;
    const starter = problem.starterCode?.[language] || DEFAULT_STARTER[language];
    setCodeByLang((prev) => ({ ...prev, [language]: starter }));
  };

  const handleRun = async () => {
    if (!problem || running) return;
    setRunning(true);
    setVerdictMode('run');
    setError('');
    try {
      const payload = {
        problemId: problem._id,
        code: currentCode,
        language,
        ...(useCustomInput ? { customInput } : {}),
      };
      const res = await submissionsApi.run(payload);
      setEvaluation(res.evaluation);
    } catch (err) {
      setError(err.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || running) return;
    setRunning(true);
    setVerdictMode('submit');
    setError('');
    try {
      const res = await submissionsApi.submit({
        problemId: problem._id,
        code: currentCode,
        language,
      });
      setEvaluation(res.evaluation);
      if (res.evaluation?.status === 'Accepted') {
        setProblem((prev) => (prev ? { ...prev, solved: true } : prev));
      }
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setRunning(false);
    }
  };

  if (loadingProblem) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-sm">
        Loading workspace...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
          {error || 'Problem not found'}
        </div>
        <Link to="/problems" className="inline-flex items-center gap-1.5 text-sm text-indigo-400">
          <ArrowLeft className="h-4 w-4" /> Back to Problems
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Top breadcrumb & action strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Directory
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            {problem.title}
            {problem.solved && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" title="Solved" />
            )}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="run-button"
            disabled={running}
            onClick={handleRun}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-100 text-sm font-semibold transition-colors"
          >
            <Play className="h-4 w-4 text-cyan-400" />
            Run
          </button>
          <button
            type="button"
            data-testid="submit-button"
            disabled={running}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Panel: Description & Test Cases */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="flex items-center border-b border-slate-800 bg-slate-900 px-3 pt-2 gap-1">
            <button
              type="button"
              onClick={() => setLeftTab('description')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                leftTab === 'description'
                  ? 'border-indigo-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Description
            </button>

            {isInstructor && (
              <button
                type="button"
                onClick={() => setLeftTab('submissions')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                  leftTab === 'submissions'
                    ? 'border-indigo-500 text-white bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Student Submissions
              </button>
            )}
          </div>

          {leftTab === 'description' ? (
            <div className="p-5 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div>{renderFormattedText(problem.description)}</div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sample I/O
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Sample Input</div>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap">
                      {problem.sampleInput || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Sample Output</div>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                      {problem.sampleOutput || '(empty)'}
                    </pre>
                  </div>
                </div>
              </div>

              {problem.testCases?.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Visible Test Cases ({problem.testCases.length} of {problem.totalTestCasesCount})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {problem.testCases.map((tc, i) => (
                      <div
                        key={tc._id || i}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5"
                      >
                        <div className="text-slate-400 font-sans font-medium flex items-center justify-between">
                          <span>Case #{i + 1}</span>
                          {tc.isHidden && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-slate-500">in: </span>
                          {tc.input.replace(/\n/g, ' ↵ ')}
                        </div>
                        <div className="text-emerald-300">
                          <span className="text-slate-500">out: </span>
                          {tc.expectedOutput}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 max-h-[calc(100vh-12rem)] overflow-y-auto space-y-3">
              {loadingSubs ? (
                <p className="text-sm text-slate-400">Loading student submissions...</p>
              ) : studentSubmissions.length === 0 ? (
                <p className="text-sm text-slate-400">No submissions yet for this problem.</p>
              ) : (
                studentSubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {sub.student?.name || 'Unknown Student'}
                      </div>
                      <div className="text-xs text-slate-400">{sub.student?.email}</div>
                      <div className="mt-1 text-xs font-mono text-slate-400">
                        {sub.language} • {sub.passedTests}/{sub.totalTests} tests • {sub.runtimeMs} ms
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Code Editor + Custom Input + Verdict */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[430px]">
            <CodeEditorPanel
              language={language}
              onLanguageChange={setLanguage}
              code={currentCode}
              onCodeChange={handleCodeChange}
              onReset={handleReset}
            />
          </div>

          {/* Custom Stdin Toggle */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2.5">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomInput}
                onChange={(e) => setUseCustomInput(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
              />
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              Test with custom stdin (used by Run)
            </label>

            {useCustomInput && (
              <textarea
                rows={3}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom stdin..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          <VerdictPanel evaluation={evaluation} mode={verdictMode} loading={running} />
        </div>
      </div>
    </div>
  );
}
