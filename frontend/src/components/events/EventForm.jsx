import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import ImageUpload from '../ui/ImageUpload.jsx'
import AntiRepeatWarning from './AntiRepeatWarning.jsx'
import { createEvent, updateEvent, deleteEvent } from '../../api/events.js'

function toDatetimeLocal(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventForm({ isOpen, onClose, event, djs = [], rooms = [], onSaved }) {
  const [form, setForm] = useState({
    title: '', dj_slots: [], room_id: '', start_date: '', end_date: '', flyer_url: '', color: ''
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [djSearch, setDjSearch] = useState('')
  const [djDropdownOpen, setDjDropdownOpen] = useState(false)
  const djSearchRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setForm({
          title: event.title || '',
          dj_slots: event.djs?.map(d => ({ dj_id: d.id, name: d.name, slot_start: d.slot_start || '', slot_end: d.slot_end || '' })) || [],
          room_id: event.room_id ? String(event.room_id) : '',
          start_date: toDatetimeLocal(event.start_date || event.date || event.start_datetime),
          end_date: toDatetimeLocal(event.end_date || event.end_datetime),
          flyer_url: event.flyer_url || '',
          color: event.color || ''
        })
      } else {
        setForm({ title: '', dj_slots: [], room_id: '', start_date: '', end_date: '', flyer_url: '', color: '' })
      }
      setDjSearch('')
      setDjDropdownOpen(false)
      setError(null)
    }
  }, [isOpen, event])

  useEffect(() => {
    if (!djDropdownOpen) return
    const handleClickOutside = (e) => {
      if (djSearchRef.current && !djSearchRef.current.contains(e.target)) setDjDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [djDropdownOpen])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: typeof e === 'string' ? e : e.target.value }))

  const addDjSlot = (dj) => {
    if (form.dj_slots.length >= 5 || form.dj_slots.some(s => s.dj_id === dj.id)) return
    setForm(f => ({ ...f, dj_slots: [...f.dj_slots, { dj_id: dj.id, name: dj.name, slot_start: '', slot_end: '' }] }))
    setDjSearch('')
    setDjDropdownOpen(false)
  }

  const removeDjSlot = (index) => setForm(f => ({ ...f, dj_slots: f.dj_slots.filter((_, i) => i !== index) }))

  const moveDjSlot = (index, direction) => {
    const newSlots = [...form.dj_slots]
    const target = index + direction
    if (target < 0 || target >= newSlots.length) return
    ;[newSlots[index], newSlots[target]] = [newSlots[target], newSlots[index]]
    setForm(f => ({ ...f, dj_slots: newSlots }))
  }

  const updateSlotTime = (index, field, value) => {
    setForm(f => ({ ...f, dj_slots: f.dj_slots.map((s, i) => i === index ? { ...s, [field]: value } : s) }))
  }

  const filteredDjResults = djSearch.trim().length === 0
    ? []
    : djs.filter(dj => dj.name.toLowerCase().includes(djSearch.toLowerCase()) && !form.dj_slots.some(s => s.dj_id === dj.id)).slice(0, 8)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        dj_slots: form.dj_slots.map((s, i) => ({ dj_id: s.dj_id, order_index: i, slot_start: s.slot_start || null, slot_end: s.slot_end || null })),
        room_id: form.room_id ? Number(form.room_id) : null,
        start_datetime: form.start_date,
        end_datetime: form.end_date || null,
        flyer_url: form.flyer_url || null,
        color: form.color || null
      }
      event ? await updateEvent(event.id, payload) : await createEvent(payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement "${form.title}" ?`)) return
    setDeleting(true)
    try {
      await deleteEvent(event.id)
      onSaved()
      onClose()
    } catch (err) {
      setError('Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'
  const labelCls = 'block text-sm font-medium text-zinc-300 mb-1.5'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'Modifier l\'événement' : 'Nouvel événement'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Titre */}
        <div>
          <label className={labelCls}>Titre <span className="text-red-400">*</span></label>
          <input type="text" value={form.title} onChange={set('title')} placeholder="Nom de l'événement" className={inputCls} />
        </div>

        {/* Room */}
        <div>
          <label className={labelCls}>Room</label>
          <select value={form.room_id} onChange={set('room_id')} className={`${inputCls} bg-zinc-800`}>
            <option value="">— Sélectionner une room —</option>
            {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
        </div>

        {/* Couleur */}
        <div>
          <label className={labelCls}>Couleur de l'événement</label>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Preset colors */}
            {['', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#ef4444', '#ffffff'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: preset }))}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                  form.color === preset ? 'border-white scale-110' : 'border-zinc-600'
                }`}
                style={{ backgroundColor: preset || '#27272a' }}
                title={preset || 'Couleur de la room (défaut)'}
              >
                {!preset && <span className="text-zinc-400 text-xs font-bold">R</span>}
              </button>
            ))}
            {/* Custom color picker */}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={form.color || '#8b5cf6'}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="sr-only"
              />
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-zinc-400 transition-colors"
                   style={{ backgroundColor: form.color && !['#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6','#ec4899','#ef4444','#ffffff',''].includes(form.color) ? form.color : 'transparent' }}>
                <span className="text-zinc-400 text-xs">+</span>
              </div>
            </label>
            {form.color && (
              <button type="button" onClick={() => setForm(f => ({ ...f, color: '' }))} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* DJs */}
        <div>
          <label className={labelCls}>
            Programmation DJs (max 5)
            {form.dj_slots.length > 0 && (
              <span className="ml-2 text-xs text-violet-400 font-normal">{form.dj_slots.length}/5</span>
            )}
          </label>

          {form.dj_slots.length > 0 && (
            <div className="border border-zinc-700 rounded-xl mb-2 overflow-hidden">
              {form.dj_slots.map((slot, i) => (
                <div key={slot.dj_id} className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 last:border-0 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <span className="text-sm font-bold text-zinc-500 w-5 text-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-white flex-1">{slot.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="time"
                      value={slot.slot_start}
                      onChange={e => updateSlotTime(i, 'slot_start', e.target.value)}
                      className="bg-zinc-700 border border-zinc-600 text-white rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                    <span className="text-zinc-600">→</span>
                    <input
                      type="time"
                      value={slot.slot_end}
                      onChange={e => updateSlotTime(i, 'slot_end', e.target.value)}
                      className="bg-zinc-700 border border-zinc-600 text-white rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => moveDjSlot(i, -1)} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition">↑</button>
                    <button type="button" onClick={() => moveDjSlot(i, 1)} disabled={i === form.dj_slots.length - 1} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition">↓</button>
                    <button type="button" onClick={() => removeDjSlot(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:text-red-400 hover:bg-red-900/30 transition">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {form.dj_slots.length < 5 && (
            <div className="relative" ref={djSearchRef}>
              <input
                type="text"
                value={djSearch}
                onChange={e => { setDjSearch(e.target.value); setDjDropdownOpen(true) }}
                onFocus={() => djSearch.trim() && setDjDropdownOpen(true)}
                placeholder="Rechercher et ajouter un DJ..."
                className={inputCls}
              />
              {djDropdownOpen && filteredDjResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredDjResults.map(dj => (
                    <button
                      key={dj.id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); addDjSlot(dj) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      {dj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <AntiRepeatWarning djId={form.dj_slots[0]?.dj_id || ''} roomId={form.room_id} />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date de début</label>
            <input type="datetime-local" value={form.start_date} onChange={set('start_date')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date de fin</label>
            <input type="datetime-local" value={form.end_date} onChange={set('end_date')} className={inputCls} />
          </div>
        </div>

        {/* Flyer */}
        <div>
          <label className={labelCls}>Flyer</label>
          <ImageUpload value={form.flyer_url} onChange={(url) => setForm(f => ({ ...f, flyer_url: url }))} />
        </div>

        <div className="flex items-center justify-between pt-2">
          {event && (
            <Button variant="danger" type="button" loading={deleting} onClick={handleDelete}>
              Supprimer l'événement
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" onClick={onClose} type="button">Annuler</Button>
            <Button variant="primary" type="submit" loading={loading}>
              {event ? 'Enregistrer' : 'Créer l\'événement'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
