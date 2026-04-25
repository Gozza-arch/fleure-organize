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
    const { default: html2canvas } = await import('html2canvas')

    // Carte dédiée à la capture — rendu simple, pas de blur/backdrop
    const card = document.createElement('div')
    card.style.cssText = `
      position: fixed; left: -9999px; top: 0;
      width: 800px; background: #111827;
      border-radius: 16px; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; border: 1px solid #374151;
    `

    const accent = event.color || event.room_color || '#8b5cf6'

    card.innerHTML = `
      <div style="width:6px;background:${accent};flex-shrink:0;"></div>
      <div style="flex:1;padding:32px 28px;display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;">Next Event</div>
            <div style="font-size:32px;font-weight:900;color:#fff;line-height:1.1;">${event.title}</div>
          </div>
          ${event.room_name ? `<span style="background:${accent};color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;white-space:nowrap;display:inline-block;line-height:1;">${event.room_icon || ''} ${event.room_name}</span>` : ''}
        </div>
        ${event.djs?.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${event.djs.map(d => `
              <span style="background:#1f2937;border:1px solid #374151;color:#d1d5db;font-size:13px;font-weight:600;padding:8px 16px;border-radius:999px;display:inline-block;line-height:1;white-space:nowrap;">
                🎧 ${d.name}${d.slot_start ? ` · ${formatTime12h(d.slot_start)}` : ''}
              </span>
            `).join('')}
          </div>
        ` : ''}
        <div style="color:#9ca3af;font-size:13px;font-weight:500;">📅 ${safeDate(event.start_datetime)}</div>
        <div style="font-size:11px;color:#4b5563;font-weight:600;letter-spacing:.05em;">FLEURE ORGANIZE</div>
      </div>
      ${event.flyer_url ? `
        <div style="width:200px;flex-shrink:0;overflow:hidden;position:relative;">
          <img src="${event.flyer_url}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
        </div>
      ` : ''}
    `

    document.body.appendChild(card)
    const canvas = await html2canvas(card, { useCORS: true, scale: 2, backgroundColor: '#111827' })
    document.body.removeChild(card)

    const link = document.createElement('a')
    const dateStr = event.start_datetime ? format(new Date(event.start_datetime), 'MMM dd yyyy', { locale: enUS }) : ''
    const roomStr = event.room_name || ''
    link.download = `${event.title} - ${roomStr} - ${dateStr}.png`
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
