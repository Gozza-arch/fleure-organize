import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import StatCard from '../components/ui/StatCard.jsx'
import FlyerPreview from '../components/events/FlyerPreview.jsx'
import EventForm from '../components/events/EventForm.jsx'
import Button from '../components/ui/Button.jsx'
import client from '../api/client.js'
import { getUpcoming } from '../api/events.js'
import { getDJs } from '../api/djs.js'
import { getRooms } from '../api/rooms.js'

function safeDate(dateStr) {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM dd, yyyy • h:mmaaa', { locale: enUS }) }
  catch { return dateStr }
}

function formatTime12h(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`
}

function timeUntil(dateStr) {
  if (!dateStr) return ''
  try { return formatDistanceToNow(new Date(dateStr), { locale: enUS, addSuffix: true }) }
  catch { return '' }
}

export default function Dashboard() {
  const [stats, setStats]       = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [djs, setDJs]           = useState([])
  const [rooms, setRooms]       = useState([])
  const [search, setSearch]     = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [djFilter, setDjFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const heroRef = useRef(null)
  const cardRefs = useRef({})

  const handleCapture = useCallback(async (event) => {
    const accent = event.color || event.room_color || '#8b5cf6'
    const SCALE = 2
    const W = 900
    const FLYER_W = event.flyer_url ? 220 : 0
    const PAD = 36
    const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

    // Pré-calcul layout pills
    const tmpCanvas = document.createElement('canvas')
    const tmpCtx = tmpCanvas.getContext('2d')
    tmpCtx.font = `600 14px ${FONT}`
    const PILL_H = 36
    const PILL_GAP = 8
    const MAX_ROW_W = W - FLYER_W - PAD * 2 - 6

    const pills = (event.djs || []).map(d => ({
      text: `🎧 ${d.name}${d.slot_start ? ` · ${formatTime12h(d.slot_start)}` : ''}`,
      w: tmpCtx.measureText(`🎧 ${d.name}${d.slot_start ? ` · ${formatTime12h(d.slot_start)}` : ''}`).width + 40
    }))

    // Disposition pills sur lignes
    const rows = []
    let row = [], rowW = 0
    pills.forEach(p => {
      if (rowW + p.w + (row.length ? PILL_GAP : 0) > MAX_ROW_W && row.length) {
        rows.push(row); row = [p]; rowW = p.w
      } else {
        row.push(p); rowW += p.w + (row.length > 1 ? PILL_GAP : 0)
      }
    })
    if (row.length) rows.push(row)

    const H = PAD + 18 + PAD + 44 + (rows.length * (PILL_H + PILL_GAP)) + PAD + 20 + PAD

    const canvas = document.createElement('canvas')
    canvas.width = W * SCALE
    canvas.height = H * SCALE
    const ctx = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)

    const rr = (x, y, w, h, r) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r)
      ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
      ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r)
      ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.closePath()
    }

    // Fond
    ctx.fillStyle = '#111827'
    rr(0, 0, W, H, 16)
    ctx.fill()

    // Barre accent gauche (simple)
    ctx.fillStyle = accent
    ctx.fillRect(0, 16, 6, H - 32)

    const CX = 6 + PAD

    // Label NEXT EVENT
    ctx.fillStyle = '#6b7280'
    ctx.font = `700 11px ${FONT}`
    ctx.fillText('NEXT EVENT', CX, PAD + 12)

    // Badge room (haut droite)
    if (event.room_name) {
      ctx.font = `700 13px ${FONT}`
      const roomLabel = `${event.room_icon ? event.room_icon + ' ' : ''}${event.room_name}`
      const rW = ctx.measureText(roomLabel).width + 36
      const rH = 34
      const rX = W - FLYER_W - PAD - rW
      const rY = PAD - 4
      ctx.fillStyle = accent
      rr(rX, rY, rW, rH, rH / 2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'middle'
      ctx.fillText(roomLabel, rX + 18, rY + rH / 2)
      ctx.textBaseline = 'alphabetic'
    }

    // Titre
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 38px ${FONT}`
    ctx.fillText(event.title, CX, PAD + 16 + 44)

    // Pills DJs
    let pillY = PAD + 16 + 44 + 20
    rows.forEach(rowPills => {
      let pillX = CX
      rowPills.forEach(p => {
        ctx.fillStyle = '#1f2937'
        rr(pillX, pillY, p.w, PILL_H, PILL_H / 2); ctx.fill()
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 1
        rr(pillX, pillY, p.w, PILL_H, PILL_H / 2); ctx.stroke()
        ctx.fillStyle = '#d1d5db'
        ctx.font = `600 14px ${FONT}`
        ctx.textBaseline = 'middle'
        ctx.fillText(p.text, pillX + 20, pillY + PILL_H / 2)
        ctx.textBaseline = 'alphabetic'
        pillX += p.w + PILL_GAP
      })
      pillY += PILL_H + PILL_GAP
    })

    // Date
    const dateLabel = safeDate(event.start_datetime)
    ctx.fillStyle = '#9ca3af'
    ctx.font = `500 13px ${FONT}`
    ctx.fillText(`📅 ${dateLabel}`, CX, pillY + 20)

    // FLEURE ORGANIZE
    ctx.fillStyle = '#374151'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('FLEURE ORGANIZE', CX, H - PAD + 8)

    // Flyer
    if (event.flyer_url) {
      try {
        const img = await new Promise((res, rej) => {
          const i = new Image(); i.crossOrigin = 'anonymous'
          i.onload = () => res(i); i.onerror = rej
          i.src = event.flyer_url
        })
        ctx.save()
        rr(W - FLYER_W, 0, FLYER_W, H, 16); ctx.clip()
        ctx.drawImage(img, W - FLYER_W, 0, FLYER_W, H)
        ctx.restore()
      } catch (_) {}
    }

    const dateStr = event.start_datetime ? format(new Date(event.start_datetime), 'MMM dd yyyy', { locale: enUS }) : ''
    const link = document.createElement('a')
    link.download = `${event.title} - ${event.room_name || ''} - ${dateStr}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: enUS })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      client.get('/dashboard/stats').then(r => r.data).catch(() => null),
      getUpcoming().catch(() => [])
    ])
      .then(([statsData, upcomingData]) => {
        setStats(statsData)
        setUpcoming(Array.isArray(upcomingData) ? upcomingData : [])
      })
      .catch(() => setError('Impossible de charger les données du tableau de bord.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    getDJs().then(d => setDJs(Array.isArray(d) ? d : d.djs || [])).catch(() => {})
    getRooms().then(d => setRooms(Array.isArray(d) ? d : d.rooms || [])).catch(() => {})
  }, [])

  const filtersActive = search || roomFilter || djFilter

  const filteredEvents = useMemo(() => upcoming
    .filter(ev => !search || ev.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(ev => !roomFilter || String(ev.room_id) === roomFilter)
    .filter(ev => !djFilter || ev.djs?.some(d => String(d.id) === djFilter)),
    [upcoming, search, roomFilter, djFilter]
  )

  const nextEvent = upcoming[0]
  const eventsToList = filtersActive ? filteredEvents : filteredEvents.slice(1)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  const selectCls = 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>

      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-white">Bonjour Fleure 👋</h1>
          <p className="text-sm text-zinc-500 mt-0.5 capitalize">{todayCapitalized}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingEvent(null); setFormOpen(true) }}>
          + Nouvel événement
        </Button>
      </div>

      <div className="p-8 space-y-8">

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total DJs"        value={stats?.totalDJs       ?? '—'} icon="🎧" color="indigo" />
          <StatCard label="Total Événements" value={stats?.totalEvents     ?? '—'} icon="🎪" color="teal"   />
          <StatCard label="À venir"          value={stats?.upcomingEvents  ?? '—'} icon="📅" color="yellow" />
          <StatCard label="Archives"         value={stats?.pastEvents      ?? '—'} icon="🗄️" color="pink"   />
        </div>

        {/* Hero — prochain événement */}
        {nextEvent && !filtersActive && (
          <div>
            <div
              ref={heroRef}
              className="relative rounded-2xl overflow-hidden flex items-stretch min-h-[180px] border border-zinc-800 cursor-pointer"
              style={{ backgroundColor: `${nextEvent.color || nextEvent.room_color || '#7c3aed'}22` }}
              onClick={() => setExpandedId(expandedId === 'hero' ? null : 'hero')}
            >
              {nextEvent.flyer_url && (
                <div className="absolute inset-0">
                  <img src={nextEvent.flyer_url} className="w-full h-full object-cover opacity-10 blur-md scale-110" alt="" />
                </div>
              )}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: nextEvent.color || nextEvent.room_color || '#8b5cf6' }} />

              <div className="relative flex-1 p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Next event</span>
                  <h2 className="text-2xl font-bold text-white mt-1 leading-tight">{nextEvent.title}</h2>
                  {nextEvent.djs?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {nextEvent.djs.map(d => (
                        <span key={d.id} className="text-xs bg-white/10 text-zinc-300 px-2.5 py-1 rounded-full font-medium border border-white/10">
                          🎧 {d.name}{d.slot_start ? ` · ${formatTime12h(d.slot_start)}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <span className="text-zinc-300 font-medium text-sm">📅 {safeDate(nextEvent.start_datetime)}</span>
                  <span className="text-zinc-600 text-xs">{timeUntil(nextEvent.start_datetime)}</span>
                  {nextEvent.room_name && (
                    <span className="flex items-center gap-1.5 text-xs text-white px-3 py-1 rounded-full font-medium" style={{ backgroundColor: nextEvent.color || nextEvent.room_color || '#8b5cf6' }}>
                      {nextEvent.room_icon && <span>{nextEvent.room_icon}</span>}
                      {nextEvent.room_name}
                    </span>
                  )}
                </div>
              </div>

              {nextEvent.flyer_url && (
                <div className="hidden lg:block w-52 flex-shrink-0 relative overflow-hidden">
                  <img src={nextEvent.flyer_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${nextEvent.color || nextEvent.room_color || '#7c3aed'}22, transparent)` }} />
                </div>
              )}
            </div>

            {expandedId === 'hero' && (
              <div className="flex gap-2 mt-2 px-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingEvent(nextEvent); setFormOpen(true); setExpandedId(null) }}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition border border-zinc-700"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCapture(nextEvent) }}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition border border-zinc-700"
                >
                  📥 Télécharger l'image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Liste événements + filtres */}
        <div>
            {/* Titre */}
            <div className="space-y-3 mb-5">
              <h2 className="text-base font-bold text-white">
                {filtersActive ? 'Résultats' : 'Événements à venir'}
              </h2>

              {/* Filtres */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className={selectCls + ' w-52'}
                />
                <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className={selectCls}>
                  <option value="">Toutes les rooms</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={djFilter} onChange={e => setDjFilter(e.target.value)} className={selectCls}>
                  <option value="">Tous les DJs</option>
                  {djs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {filtersActive && (
                  <button
                    onClick={() => { setSearch(''); setRoomFilter(''); setDjFilter('') }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Événements */}
            {eventsToList.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-3">{filtersActive ? '🔍' : '📭'}</div>
                <div className="text-zinc-500 font-medium">
                  {filtersActive ? 'Aucun événement ne correspond aux filtres' : 'Aucun événement à venir'}
                </div>
                {filtersActive && (
                  <button
                    onClick={() => { setSearch(''); setRoomFilter(''); setDjFilter('') }}
                    className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {eventsToList.map(event => (
                  <div key={event.id}>
                    <div
                      ref={el => cardRefs.current[event.id] = el}
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center gap-5 p-4 transition-all duration-200 cursor-pointer"
                      style={{ borderLeft: `3px solid ${event.color || event.room_color || '#8b5cf6'}` }}
                      onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                        <FlyerPreview url={event.flyer_url} className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{event.title || 'Sans titre'}</div>
                        {event.djs?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {event.djs.map(d => (
                              <span key={d.id} className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                                🎧 {d.name}{d.slot_start ? ` ${formatTime12h(d.slot_start)}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-zinc-600 mt-1">{safeDate(event.start_datetime)}</div>
                      </div>

                      {event.room_name && (
                        <span
                          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor: event.color || event.room_color || '#8b5cf6' }}
                        >
                          {event.room_icon && <span>{event.room_icon}</span>}
                          {event.room_name}
                        </span>
                      )}
                    </div>

                    {expandedId === event.id && (
                      <div className="flex gap-2 mt-1 px-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setFormOpen(true); setExpandedId(null) }}
                          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition border border-zinc-700"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCapture(event) }}
                          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition border border-zinc-700"
                        >
                          📥 Télécharger l'image
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

      </div>

      <EventForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        event={editingEvent}
        djs={djs}
        rooms={rooms}
        onSaved={fetchData}
      />
    </div>
  )
}
