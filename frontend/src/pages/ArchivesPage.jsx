import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import ArchiveCard from '../components/archives/ArchiveCard.jsx'
import Modal from '../components/ui/Modal.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import FlyerPreview from '../components/events/FlyerPreview.jsx'
import { getArchives, getArchiveStats } from '../api/archives.js'
import { getDJs } from '../api/djs.js'
import { getRooms } from '../api/rooms.js'

function safeFormat(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return format(d, 'dd MMMM yyyy • HH:mm', { locale: fr })
  } catch { return dateStr }
}

const PAGE_SIZE = 12

export default function ArchivesPage() {
  const [archives, setArchives] = useState([])
  const [stats, setStats] = useState(null)
  const [djs, setDJs] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [search, setSearch] = useState('')
  const [djFilter, setDjFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchArchives = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    reset ? setLoading(true) : setLoadingMore(true)
    setError(null)
    try {
      const params = { page: currentPage, limit: PAGE_SIZE }
      if (search) params.search = search
      if (djFilter) params.dj_id = djFilter
      if (roomFilter) params.room_id = roomFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const data = await getArchives(params)
      const items = Array.isArray(data) ? data : data.archives || data.events || []

      if (reset) { setArchives(items); setPage(2) }
      else { setArchives(prev => [...prev, ...items]); setPage(p => p + 1) }

      setHasMore(items.length === PAGE_SIZE)
    } catch { setError('Impossible de charger les archives.') }
    finally { setLoading(false); setLoadingMore(false) }
  }, [search, djFilter, roomFilter, dateFrom, dateTo, page])

  useEffect(() => { setPage(1); setHasMore(true); fetchArchives(true) }, [search, djFilter, roomFilter, dateFrom, dateTo])

  useEffect(() => {
    getArchiveStats().then(d => setStats(d)).catch(() => setStats(null))
    getDJs().then(d => setDJs(Array.isArray(d) ? d : d.djs || [])).catch(() => setDJs([]))
    getRooms().then(d => setRooms(Array.isArray(d) ? d : d.rooms || [])).catch(() => setRooms([]))
  }, [])

  const hasFilters = search || djFilter || roomFilter || dateFrom || dateTo
  const selectCls = 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'
  const inputCls = 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Archives</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Événements passés</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">🗄️</span>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total_events ?? archives.length}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Événements archivés</div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total_flyers ?? '—'}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Flyers sauvegardés</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher dans les archives..." />
          </div>
          <select value={djFilter} onChange={e => setDjFilter(e.target.value)} className={selectCls}>
            <option value="">Tous les DJs</option>
            {djs.map(dj => <option key={dj.id} value={dj.id}>{dj.name}</option>)}
          </select>
          <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className={selectCls}>
            <option value="">Toutes les rooms</option>
            {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm text-zinc-500 font-medium">Du :</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
          <label className="text-sm text-zinc-500 font-medium">Au :</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setDjFilter(''); setRoomFilter(''); setDateFrom(''); setDateTo('') }}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : archives.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📂</div>
          <div className="text-white font-semibold text-lg">Aucune archive trouvée</div>
          <div className="text-sm text-zinc-500 mt-1">Les événements passés apparaîtront automatiquement ici.</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {archives.map(event => (
              <ArchiveCard key={event.id} event={event} onClick={setSelectedEvent} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => !loadingMore && hasMore && fetchArchives(false)}
                disabled={loadingMore}
                className="px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <><div className="w-4 h-4 border-2 border-zinc-600 border-t-violet-500 rounded-full animate-spin" />Chargement...</>
                ) : 'Charger plus'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Event detail modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || 'Événement'} size="md">
        {selectedEvent && (
          <div className="space-y-5">
            <div className="rounded-xl overflow-hidden h-64 bg-zinc-800">
              <FlyerPreview url={selectedEvent.flyer_url} className="w-full h-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                {(selectedEvent.room_name || selectedEvent.room?.name) && (
                  <span
                    className="text-xs font-semibold text-white px-3 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedEvent.room_color || selectedEvent.room?.color || '#8b5cf6' }}
                  >
                    {selectedEvent.room_name || selectedEvent.room?.name}
                  </span>
                )}
              </div>
              {selectedEvent.djs?.length > 0 && (
                <div className="space-y-1">
                  {selectedEvent.djs.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <span className="text-zinc-600 font-bold">{i + 1}.</span>
                      <span>🎧 {d.name}</span>
                      {d.slot_start && <span className="text-zinc-600">{d.slot_start}{d.slot_end ? ` → ${d.slot_end}` : ''}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <span>📅</span>
                <span>{safeFormat(selectedEvent.start_datetime || selectedEvent.start_date || selectedEvent.date)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
