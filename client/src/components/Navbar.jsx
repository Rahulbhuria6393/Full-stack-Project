import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Code2, FilePlus2, History, LogOut, ShieldCheck, Terminal, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isInstructor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to={isAuthenticated ? '/problems' : '/login'} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">EvalEngine</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Judge v1
              </span>
            </div>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/problems" className={navLinkClass}>
                <Code2 className="h-4 w-4" />
                Problems
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History className="h-4 w-4" />
                Submissions
              </NavLink>
              {isInstructor && (
                <NavLink to="/instructor/problems/new" className={navLinkClass}>
                  <FilePlus2 className="h-4 w-4" />
                  Create Problem
                </NavLink>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                {isInstructor ? (
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                ) : (
                  <User className="h-4 w-4 text-cyan-400" />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{user?.name}</span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      isInstructor
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="md:hidden border-t border-slate-800/70 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <NavLink to="/problems" className={navLinkClass}>
            <Code2 className="h-4 w-4" />
            Problems
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            <History className="h-4 w-4" />
            Submissions
          </NavLink>
          {isInstructor && (
            <NavLink to="/instructor/problems/new" className={navLinkClass}>
              <FilePlus2 className="h-4 w-4" />
              Create
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
