import { useState, useEffect } from 'react'
import { checkRepeat } from '../../api/djs.js'

export default function AntiRepeatWarning({ djId, roomId }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!djId || !roomId) { setResult(null); return }
    setLoading(true)
    const controller = new AbortController()
    checkRepeat(djId, roomId)
      .then(data => { if (!controller.signal.aborted) setResult(data) })
      .catch(err => { if (!controller.signal.aborted) { console.error(err); setResult(null) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [djId, roomId])

  if (!djId || !roomId) return null

  if (loading) return (
    <div className="text-xs text-zinc-500 flex items-center gap-2">
      <div className="w-3 h-3 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      Vérification anti-répétition...
    </div>
  )

  if (!result || result.risk === 'none') return null

  if (result.risk === 'warning') return (
    <div className="flex items-start gap-2.5 bg-amber-900/20 border border-amber-700/30 text-amber-400 px-4 py-3 rounded-xl text-sm">
      <span className="text-lg flex-shrink-0">⚠️</span>
      <div>
        <div className="font-semibold">Attention — répétition potentielle</div>
        <div className="text-amber-500/70 text-xs mt-0.5">{result.message || 'Ce DJ a déjà joué dans cette room récemment.'}</div>
      </div>
    </div>
  )

  if (result.risk === 'danger') return (
    <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-700/30 text-red-400 px-4 py-3 rounded-xl text-sm">
      <span className="text-lg flex-shrink-0">❌</span>
      <div>
        <div className="font-semibold">Répétition trop rapprochée !</div>
        <div className="text-red-500/70 text-xs mt-0.5">{result.message || 'Ce DJ a déjà joué très récemment dans cette room.'}</div>
      </div>
    </div>
  )

  return null
}
