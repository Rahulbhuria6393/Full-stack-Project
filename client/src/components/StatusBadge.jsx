import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  Accepted: {
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    Icon: CheckCircle2,
  },
  Executed: {
    cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    Icon: CheckCircle2,
  },
  'Wrong Answer': {
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    Icon: XCircle,
  },
  'Time Limit Exceeded': {
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    Icon: Clock,
  },
  'Runtime Error': {
    cls: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    Icon: AlertTriangle,
  },
  Pending: {
    cls: 'bg-slate-700/40 text-slate-300 border-slate-600',
    Icon: Loader2,
  },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <Icon className={`h-3.5 w-3.5 ${status === 'Pending' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}
