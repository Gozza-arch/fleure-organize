import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import StarRating from '../ui/StarRating.jsx'
import { createEvent } from '../../api/events.js'

function toDatetimeLocal(d) {
  if (!d) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptySlot = () => ({ title: '', room_id: '', start_date: '', end_date: '' })

export default function DJSchedulePanel({ isOpen, onClose, dj, rooms = [], onSaved }) {
  const [slots, setSlots] = useState([emptySlot()])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState(0)

  const updateSlot = (i, field, value) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const addSlot = () => {
    if (slots.length >= 8) return
    // Pré-remplir la date du slot précédent si dispo
    const last = slots[slots.length - 1]
    setSlots(prev => [...prev, { ...emptySlot(), room_id: last.room_id }])
  }

  const removeSlot = (i) => {
    if (slots.length === 1) return
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleClose = () => {
    setSlots([emptySlot()])
    setErrors([])
    setSuccess(0)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validation
    const newErrors = slots.map(s => {
      if (!s.title.trim()) return 'Le titre est obligatoire'
      if (!s.start_date) return 'La date de début est obligatoire'
      return null
    })
    setErrors(newErrors)
    if (newErrors.some(Boolean)) return

    setLoading(true)
    let created = 0
    for (const slot of slots) {
      try {
        await createEvent({
          title: slot.title,
          dj_slots: [{ dj_id: dj.id, order_index: 0, slot_start: null, slot_end: null }],
          room_id: slot.room_id ? Number(slot.room_id) : null,
          start_datetime: slot.start_date,
          end_datetime: slot.end_date || null,
          flyer_url: null,
          color: null
        })
        created++
      } catch {}
    }
    setLoading(false)
    setSuccess(created)
    if (created === slots.length) {
      onSaved()
      setTimeout(handleClose, 1200)
    }
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="lg">
      <div className="space-y-6">

        {/* DJ Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{dj?.name}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <StarRating value={dj?.rating || 0} />
              {dj?.genres?.length > 0 && (
                <span className="text-xs text-zinc-500">{dj.genres.slice(0, 3).join(' · ')}</span>
              )}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Programmer</div>
            <div className="text-sm text-zinc-400">{slots.length} événement{slots.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Success banner */}
        {success > 0 && (
          <div className="bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium">
            ✅ {success} événement{success > 1 ? 's' : ''} créé{success > 1 ? 's' : ''} avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {slots.map((slot, i) => (
            <div
              key={i}
              className="bg-zinc-800/50 border border-zinc-700/60 rounded-2xl p-4 space-y-3 relative"
            >
              {/* Slot header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Événement {i + 1}
                </span>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Titre */}
              <input
                type="text"
                value={slot.title}
                onChange={e => updateSlot(i, 'title', e.target.value)}
                placeholder="Nom de l'événement *"
                className={inputCls}
              />
              {errors[i] && <p className="text-xs text-red-400">{errors[i]}</p>}

              {/* Room + Date sur une ligne */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={slot.room_id}
                  onChange={e => updateSlot(i, 'room_id', e.target.value)}
                  className={inputCls + ' bg-zinc-800'}
                >
                  <option value="">— Room —</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                <input
                  type="datetime-local"
                  value={slot.start_date}
                  onChange={e => updateSlot(i, 'start_date', e.target.value)}
                  className={inputCls}
                  placeholder="Date de début *"
                />
              </div>

              {/* Date de fin (optionnel) */}
              <input
                type="datetime-local"
                value={slot.end_date}
                onChange={e => updateSlot(i, 'end_date', e.target.value)}
                className={inputCls}
                placeholder="Date de fin (optionnel)"
              />
            </div>
          ))}

          {/* Ajouter un événement */}
          {slots.length < 8 && (
            <button
              type="button"
              onClick={addSlot}
              className="w-full py-3 border-2 border-dashed border-zinc-700 hover:border-violet-500/50 rounded-2xl text-zinc-500 hover:text-violet-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un événement
            </button>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleClose}>Annuler</Button>
            <Button variant="primary" type="submit" loading={loading}>
              Créer {slots.length} événement{slots.length > 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
