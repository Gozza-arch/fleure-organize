const colorMap = {
  indigo: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  teal:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20'   },
  yellow: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
  pink:   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20'   },
  green:  { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20'}
}

export default function StatCard({ label, value, icon, color = 'indigo' }) {
  const c = colorMap[color] || colorMap.indigo

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${c.bg} border ${c.border}`}>
        <span>{icon}</span>
      </div>
      <div>
        <div className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</div>
        <div className="text-xs text-zinc-500 mt-0.5 font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}
