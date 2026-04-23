export default function MessageEditor({ value = '', onChange, templates = [] }) {
  const charCount = value.length

  const loadTemplate = (e) => {
    const templateId = e.target.value
    if (!templateId) return
    const tpl = templates.find(t => String(t.id) === String(templateId))
    if (tpl) onChange(tpl.body || tpl.content || '')
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {templates.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 font-medium whitespace-nowrap">Charger un template :</label>
          <select
            onChange={loadTemplate}
            defaultValue=""
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition"
          >
            <option value="">— Sélectionner un template —</option>
            {templates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder="Message Discord pour cet événement..."
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 resize-y font-mono transition"
      />

      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-zinc-600">
          Variables :{' '}
          {['{dj_name}', '{room}', '{date}', '{time}', '{title}'].map(v => (
            <code key={v} className="bg-zinc-800 border border-zinc-700 text-violet-400 px-1.5 py-0.5 rounded text-xs mx-0.5">{v}</code>
          ))}
        </p>
        <span className={`text-xs whitespace-nowrap flex-shrink-0 ${charCount > 2000 ? 'text-red-400 font-semibold' : 'text-zinc-600'}`}>
          {charCount} / 2000
        </span>
      </div>
    </div>
  )
}
