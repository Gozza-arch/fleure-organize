import { useState, useEffect, useCallback } from 'react'
import DJCard from '../components/djs/DJCard.jsx'
import DJForm from '../components/djs/DJForm.jsx'
import DJSchedulePanel from '../components/djs/DJSchedulePanel.jsx'
import Button from '../components/ui/Button.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import { getDJs, deleteDJ } from '../api/djs.js'
import { getRooms } from '../api/rooms.js'

export default function DJsPage() {
  const [djs, setDJs] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [prestationsSort, setPrestationsSort] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingDJ, setEditingDJ] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedulingDJ, setSchedulingDJ] = useState(null)

  const fetchDJs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search) params.search = search
      if (roomFilter) params.room_id = roomFilter
      const data = await getDJs(params)
      setDJs(Array.isArray(data) ? data : data.djs || [])
    } catch { setError('Impossible de charger les DJs.') }
    finally { setLoading(false) }
  }, [search, roomFilter])

  useEffect(() => { fetchDJs() }, [fetchDJs])
  useEffect(() => {
    getRooms().then(data => setRooms(Array.isArray(data) ? data : data.rooms || [])).catch(() => setRooms([]))
  }, [])

  const handleSchedule = (dj) => { setSchedulingDJ(dj); setScheduleOpen(true) }
  const handleEdit = (dj) => { setEditingDJ(dj); setFormOpen(true) }
  const handleDelete = async (dj) => {
    if (!window.confirm(`Supprimer le DJ "${dj.name}" ?`)) return
    try { await deleteDJ(dj.id); fetchDJs() }
    catch { alert('Erreur lors de la suppression.') }
  }

  const allGenres = [...new Set(djs.flatMap(dj => dj.genres || []))].sort()

  const filteredDJs = djs
    .filter(dj => ratingFilter === '' || dj.rating === Number(ratingFilter))
    .filter(dj => genreFilter === '' || (dj.genres || []).includes(genreFilter))
    .sort((a, b) => {
      if (prestationsSort === 'asc') return (a.prestations_count ?? 0) - (b.prestations_count ?? 0)
      if (prestationsSort === 'desc') return (b.prestations_count ?? 0) - (a.prestations_count ?? 0)
      return 0
    })

  const selectCls = 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DJs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{djs.length} DJ{djs.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingDJ(null); setFormOpen(true) }}>
          + Ajouter un DJ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un DJ..." />
        </div>
        <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className={selectCls}>
          <option value="">Toutes les rooms</option>
          {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
        <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} className={selectCls}>
          <option value="">Toutes les notes</option>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} {n}/5</option>)}
        </select>
        <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className={selectCls}>
          <option value="">Tous les genres</option>
          {allGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
        </select>
        <select value={prestationsSort} onChange={e => setPrestationsSort(e.target.value)} className={selectCls}>
          <option value="">Tri par défaut</option>
          <option value="asc">Prestations ↑</option>
          <option value="desc">Prestations ↓</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredDJs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🎧</div>
          <div className="text-white font-semibold text-lg">Aucun DJ trouvé</div>
          <div className="text-sm text-zinc-500 mt-1">
            {search || roomFilter || ratingFilter || genreFilter
              ? 'Modifiez vos filtres de recherche.'
              : 'Ajoutez votre premier DJ !'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredDJs.map(dj => (
            <DJCard key={dj.id} dj={dj} onEdit={handleEdit} onDelete={handleDelete} onSchedule={handleSchedule} />
          ))}
        </div>
      )}

      <DJForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingDJ(null) }}
        dj={editingDJ}
        rooms={rooms}
        onSaved={fetchDJs}
      />

      <DJSchedulePanel
        isOpen={scheduleOpen}
        onClose={() => { setScheduleOpen(false); setSchedulingDJ(null) }}
        dj={schedulingDJ}
        rooms={rooms}
        onSaved={fetchDJs}
      />
    </div>
  )
}
