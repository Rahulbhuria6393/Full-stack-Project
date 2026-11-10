import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Code2, History, X } from 'lucide-react';
import { submissionsApi } from '../api/client';
import DifficultyBadge from '../components/DifficultyBadge';
import StatusBadge from '../components/StatusBadge';

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await submissionsApi.myHistory({
          page,
          limit: 10,
          status: statusFilter,
        });
        if (active) {
          setSubmissions(res.submissions || []);
          setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load submission history');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [page, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-indigo-400" />
            Submission History
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Inspect past evaluation verdicts, test case counts, and execution runtimes.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 self-start"
        >
          <option value="">All Verdicts</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
          <option value="Time Limit Exceeded">Time Limit Exceeded</option>
          <option value="Runtime Error">Runtime Error</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Problem</th>
                <th className="py-3.5 px-5">Verdict</th>
                <th className="py-3.5 px-5">Language</th>
                <th className="py-3.5 px-5">Tests</th>
                <th className="py-3.5 px-5">Runtime</th>
                <th className="py-3.5 px-5">Submitted</th>
                <th className="py-3.5 px-5 text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading submission history...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No submissions recorded yet. Solve a problem from the directory to see results here.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5">
                      {sub.problem ? (
                        <div className="flex items-center gap-2.5">
                          <Link
                            to={`/problems/${sub.problem._id}`}
                            className="font-semibold text-white hover:text-indigo-300 transition-colors"
                          >
                            {sub.problem.title}
                          </Link>
                          <DifficultyBadge difficulty={sub.problem.difficulty} />
                        </div>
                      ) : (
                        <span className="text-slate-500">Deleted Problem</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        {sub.language}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-300">
                      {sub.passedTests}/{sub.totalTests}
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-cyan-300">
                      {sub.runtimeMs} ms
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSub(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        View Code
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-slate-200">{pagination.page}</strong> of{' '}
            <strong className="text-slate-200">{pagination.totalPages}</strong> ({pagination.total}{' '}
            submissions)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Preview Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white">
                  {selectedSub.problem?.title || 'Submission Source'}
                </h3>
                <StatusBadge status={selectedSub.status} />
                <span className="text-xs font-mono text-slate-400">
                  {selectedSub.language} • {selectedSub.runtimeMs} ms
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="p-5 bg-slate-950 text-xs font-mono text-slate-200 overflow-auto max-h-[65vh] whitespace-pre">
              {selectedSub.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
