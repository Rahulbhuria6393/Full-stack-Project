import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  FilePlus2,
  Search,
  Sparkles,
} from 'lucide-react';
import { problemsApi } from '../api/client';
import DifficultyBadge from '../components/DifficultyBadge';
import { useAuth } from '../context/AuthContext';

const DIFFICULTIES = ['', 'Easy', 'Medium', 'Hard'];

export default function ProblemsPage() {
  const { isInstructor } = useAuth();
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    const fetchProblems = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await problemsApi.list({
          search: debouncedSearch,
          difficulty,
          page,
          limit: 8,
        });
        if (active) {
          setProblems(res.problems || []);
          setPagination(res.pagination || { total: 0, page: 1, limit: 8, totalPages: 1 });
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load problems');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProblems();
    return () => {
      active = false;
    };
  }, [debouncedSearch, difficulty, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Code2 className="h-6 w-6 text-indigo-400" />
            Problem Directory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select an assignment to write, test, and submit solutions in JavaScript or Python.
          </p>
        </div>

        {isInstructor && (
          <Link
            to="/instructor/problems/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-colors self-start"
          >
            <FilePlus2 className="h-4 w-4" />
            Create Problem
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="problem-search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search problems by title..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {DIFFICULTIES.map((diff) => {
            const label = diff || 'All';
            const active = difficulty === diff;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setDifficulty(diff);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Problem Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5 w-12">Status</th>
                <th className="py-3.5 px-5">Problem</th>
                <th className="py-3.5 px-5">Difficulty</th>
                <th className="py-3.5 px-5">Test Suite</th>
                <th className="py-3.5 px-5">Instructor</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading problems...
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No coding problems match your search criteria.
                  </td>
                </tr>
              ) : (
                problems.map((problem) => (
                  <tr
                    key={problem._id}
                    data-testid={`problem-row-${problem._id}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      {problem.solved ? (
                        <CheckCircle2
                          className="h-5 w-5 text-emerald-400"
                          title="Accepted solution submitted"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-700" />
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <Link
                        to={`/problems/${problem._id}`}
                        className="font-semibold text-white hover:text-indigo-300 transition-colors"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="py-4 px-5">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </td>
                    <td className="py-4 px-5 text-slate-400 font-mono text-xs">
                      {problem.visibleTestCasesCount ?? 0} sample / {problem.totalTestCasesCount ?? 0} total
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs">
                      {problem.createdBy?.name || 'Instructor'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to={`/problems/${problem._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong className="text-slate-200">{pagination.page}</strong> of{' '}
            <strong className="text-slate-200">{pagination.totalPages}</strong> ({pagination.total}{' '}
            total)
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
    </div>
  );
}
