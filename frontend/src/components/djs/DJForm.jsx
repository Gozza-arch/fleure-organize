import { useState, useEffect } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import StarRating from '../ui/StarRating.jsx'
import Badge from '../ui/Badge.jsx'
import { createDJ, updateDJ } from '../../api/djs.js'

export default function DJForm({ isOpen, onClose, dj, rooms = [], onSaved }) {
  const [form, setForm] = useState({ name: '', rating: 3, genres: [], room_ids: [], notes: '' })
  const [genreInput, setGenreInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      if (dj) {
        setForm({
          name: dj.name || '',
          rating: dj.rating || 3,
          genres: dj.genres || [],
          room_ids: dj.rooms?.map(r => r.id) || [],
          notes: dj.notes || ''
        })
      } else {
        setForm({ name: '', rating: 3, genres: [], room_ids: [], notes: '' })
      }
      setGenreInput('')
      setError(null)
    }
  }, [isOpen, dj])

  const addGenre = (raw) => {
    const trimmed = raw.trim()
    if (trimmed && !form.genres.includes(trimmed)) {
      setForm(f => ({ ...f, genres: [...f.genres, trimmed] }))
    }
    setGenreInput('')
  }

  const removeGenre = (genre) => {
    setForm(f => ({ ...f, genres: f.genres.filter(g => g !== genre) }))
  }

  const handleGenreKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addGenre(genreInput) }
  }

  const toggleRoom = (roomId) => {
    setForm(f => ({
      ...f,
      room_ids: f.room_ids.includes(roomId)
        ? f.room_ids.filter(id => id !== roomId)
        : [...f.room_ids, roomId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Le nom du DJ est obligatoire.'); return }
    setLoading(true)
    setError(null)
    try {
      dj ? await updateDJ(dj.id, form) : await createDJ(form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'
  const labelCls = 'block text-sm font-medium text-zinc-300 mb-1.5'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dj ? 'Modifier le DJ' : 'Ajouter un DJ'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Nom */}
        <div>
          <label className={labelCls}>Nom <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom du DJ"
            className={inputCls}
          />
        </div>

        {/* Note */}
        <div>
          <label className={labelCls}>Note</label>
          <StarRating value={form.rating} onChange={val => setForm(f => ({ ...f, rating: val }))} />
        </div>

        {/* Genres */}
        <div>
          <label className={labelCls}>Styles musicaux</label>
          {form.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.genres.map((genre) => (
                <span key={genre} className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  {genre}
                  <button type="button" onClick={() => removeGenre(genre)} className="text-zinc-500 hover:text-white ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={genreInput}
            onChange={e => setGenreInput(e.target.value)}
            onKeyDown={handleGenreKeyDown}
            onBlur={() => genreInput.trim() && addGenre(genreInput)}
            placeholder="Techno, House... (Entrée pour ajouter)"
            className={inputCls}
          />
        </div>

        {/* Rooms */}
        {rooms.length > 0 && (
          <div>
            <label className={labelCls}>Rooms assignées</label>
            <div className="space-y-2">
              {rooms.map((room) => (
                <label key={room.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.room_ids.includes(room.id)}
                    onChange={() => toggleRoom(room.id)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-600 focus:ring-violet-500/40"
                  />
                  <span className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {room.color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: room.color }} />}
                    {room.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Informations complémentaires..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Annuler</Button>
          <Button variant="primary" type="submit" loading={loading}>
            {dj ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
