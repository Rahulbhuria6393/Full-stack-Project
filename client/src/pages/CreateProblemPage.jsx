import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FilePlus2, Plus, Save, Trash2 } from 'lucide-react';
import { problemsApi } from '../api/client';

export default function CreateProblemPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [description, setDescription] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [jsStarter, setJsStarter] = useState(
    `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\nconsole.log(input);`
  );
  const [pyStarter, setPyStarter] = useState(
    `import sys\ndata = sys.stdin.read().strip()\n\nprint(data)`
  );
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isHidden: false },
  ]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTestCase = () => {
    setTestCases((prev) => [...prev, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const removeTestCase = (idx) => {
    if (testCases.length <= 1) return;
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTestCase = (idx, field, value) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await problemsApi.create({
        title,
        difficulty,
        description,
        sampleInput,
        sampleOutput,
        starterCode: {
          javascript: jsStarter,
          python: pyStarter,
        },
        testCases,
      });
      navigate(`/problems/${res.problem._id}`);
    } catch (err) {
      setError(err.message || 'Failed to publish problem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FilePlus2 className="h-6 w-6 text-indigo-400" />
          Create Coding Assignment
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Author a new problem statement with public sample cases and hidden grading test cases.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Problem Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maximum Subarray Sum"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description (Markdown supported)
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem statement, input/output format, and constraints..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sample Input
              </label>
              <textarea
                rows={3}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="5&#10;1 2 3 4 5"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sample Output
              </label>
              <textarea
                rows={3}
                value={sampleOutput}
                onChange={(e) => setSampleOutput(e.target.value)}
                placeholder="15"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                JavaScript Starter Template
              </label>
              <textarea
                rows={4}
                value={jsStarter}
                onChange={(e) => setJsStarter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Python Starter Template
              </label>
              <textarea
                rows={4}
                value={pyStarter}
                onChange={(e) => setPyStarter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Test Cases Builder */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Grading Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Test Case
            </button>
          </div>

          <div className="space-y-4">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Test Case #{idx + 1}</span>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={(e) => updateTestCase(idx, 'isHidden', e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                      />
                      Hidden Test Case
                    </label>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(idx)}
                        className="text-rose-400 hover:text-rose-300"
                        title="Remove test case"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Input (stdin)</label>
                    <textarea
                      rows={2}
                      value={tc.input}
                      onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Expected Output (stdout)
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-colors"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Publishing...' : 'Publish Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}
