const COLOR_CLASSES = [
  'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20',
  'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  'bg-pink-500/15 text-pink-300 border border-pink-500/20',
  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  'bg-violet-500/15 text-violet-300 border border-violet-500/20',
  'bg-orange-500/15 text-orange-300 border border-orange-500/20'
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash)
}

export default function Badge({ label }) {
  const colorClass = COLOR_CLASSES[hashString(label || '') % COLOR_CLASSES.length]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
