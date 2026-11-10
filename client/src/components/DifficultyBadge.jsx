const STYLES = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function DifficultyBadge({ difficulty }) {
  const cls = STYLES[difficulty] || 'bg-slate-800 text-slate-300 border-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {difficulty}
    </span>
  );
}
