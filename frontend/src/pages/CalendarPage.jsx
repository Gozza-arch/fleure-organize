import { useState, useEffect, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, addMonths, subMonths, isSameMonth, getDay
} from 'date-fns'
import { fr } from 'date-fns/locale'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EventForm from '../components/events/EventForm.jsx'
import FlyerPreview from '../components/events/FlyerPreview.jsx'
import { getEvents, deleteEvent } from '../api/events.js'
import { getDJs } from '../api/djs.js'
import { getRooms } from '../api/rooms.js'

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function getCalendarDays(currentMonth) {
  const start = startOfMonth(currentMonth)
  const end = endOfMonth(currentMonth)
  let dayOfWeek = getDay(start)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const days = eachDayOfInterval({ start, end })
  const padded = Array(offset).fill(null).concat(days)
  while (padded.length % 7 !== 0) padded.push(null)
  return padded
}

function safeFormat(dateStr, fmt) {
  if (!dateStr) return '—'
  try { return format(typeof dateStr === 'string' ? new Date(dateStr) : dateStr, fmt, { locale: fr }) }
  catch { return dateStr }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [djs, setDJs] = useState([])
  const [rooms, setRooms] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayModalOpen, setDayModalOpen] = useState(false)

  const calendarDays = getCalendarDays(currentMonth)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const data = await getEvents({ year, month })
      setEvents(Array.isArray(data) ? data : data.events || [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }, [currentMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])
  useEffect(() => {
    getDJs().then(d => setDJs(Array.isArray(d) ? d : d.djs || [])).catch(() => setDJs([]))
    getRooms().then(d => setRooms(Array.isArray(d) ? d : d.rooms || [])).catch(() => setRooms([]))
  }, [])

  const getEventsForDay = (day) => {
    if (!day) return []
    return events.filter(ev => {
      if (!ev.start_datetime) return false
      try { return isSameDay(new Date(ev.start_datetime), day) }
      catch { return false }
    })
  }

  const handleDayClick = (day) => {
    if (!day || !isSameMonth(day, currentMonth)) return
    setSelectedDay(day)
    setDayModalOpen(true)
  }

  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Supprimer "${event.title}" ?`)) return
    try { await deleteEvent(event.id); fetchEvents(); setDayModalOpen(false) }
    catch { alert('Erreur lors de la suppression.') }
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 space-y-6">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-6xl font-black text-white leading-none capitalize">
            {format(currentMonth, 'MMMM', { locale: fr })}
          </h1>
          <p className="text-6xl font-black text-zinc-700 leading-none mt-1">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <Button variant="primary" onClick={() => { setEditingEvent(null); setFormOpen(true) }}>
            + Ajouter
          </Button>
        </div>
      </div>

      {/* ── Rooms legend ────────────────────────────── */}
      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rooms.map(room => (
            <span key={room.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: room.color || '#8b5cf6' }}>
              {room.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Calendar ────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map(day => (
              <div key={day} className="text-center text-xs font-bold text-zinc-600 py-2 tracking-[0.2em]">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5" style={{ gridAutoRows: '1fr' }}>
            {calendarDays.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : []
              const isToday = day && isSameDay(day, new Date())
              const isCurrentMonth = day && isSameMonth(day, currentMonth)
              const firstEvent = dayEvents[0]
              const hasEvent = dayEvents.length > 0

              // Cell color: room color if event, else dark
              const cellBg = hasEvent
                ? (firstEvent.color || firstEvent.room_color || '#8b5cf6')
                : '#141414'

              return (
                <div
                  key={idx}
                  onClick={() => day && isCurrentMonth && handleDayClick(day)}
                  className={`relative min-h-[180px] rounded-xl p-3 transition-all duration-200 ${
                    !day ? 'bg-transparent' :
                    !isCurrentMonth ? 'bg-[#0f0f0f] opacity-30 cursor-default' :
                    hasEvent ? 'cursor-pointer hover:brightness-110' :
                    'cursor-pointer hover:bg-[#1e1e1e]'
                  }`}
                  style={hasEvent && day && isCurrentMonth ? { backgroundColor: cellBg } : !day || !isCurrentMonth ? {} : { backgroundColor: '#141414' }}
                >
                  {/* Flyer pleine hauteur à droite */}
                  {firstEvent?.flyer_url && isCurrentMonth && (
                    <div className="absolute top-0 right-0 bottom-0 w-28 rounded-r-xl overflow-hidden">
                      <img src={firstEvent.flyer_url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${cellBg} 0%, transparent 40%)` }} />
                    </div>
                  )}
                  {day && (
                    <>
                      {/* Date number */}
                      <div className={`text-sm font-bold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-white text-black'
                          : hasEvent
                          ? 'text-white/80'
                          : 'text-zinc-600'
                      }`}>
                        {format(day, 'd')}
                      </div>

                      {/* First event title — fills the cell */}
                      {firstEvent && (
                        <div className="mt-1">
                          <div className="text-white font-extrabold text-sm leading-tight tracking-wide uppercase">
                            {firstEvent.title}
                          </div>
                          {firstEvent.djs?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {firstEvent.djs.map(d => (
                                <div key={d.id} className="flex items-center gap-1.5 text-white font-semibold text-xs">
                                  <svg className="w-3 h-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                  <span>{d.name}</span>
                                  {d.slot_start && <span className="opacity-70 font-normal">· {d.slot_start}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* +N more events badge */}
                      {dayEvents.length > 1 && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs font-bold text-white/80 bg-black/30 px-1.5 py-0.5 rounded-full">
                            +{dayEvents.length - 1}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Day modal ───────────────────────────────── */}
      <Modal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title={selectedDay ? format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr }) : ''}
        size="md"
      >
        {selectedDayEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-zinc-500">Aucun événement ce jour</div>
            <Button variant="primary" className="mt-4" onClick={() => { setDayModalOpen(false); setEditingEvent(null); setFormOpen(true) }}>
              Ajouter un événement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedDayEvents.map(ev => (
              <div
                key={ev.id}
                className="flex gap-4 p-4 rounded-xl border border-zinc-700"
                style={{ backgroundColor: `${ev.room_color || '#8b5cf6'}20` }}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                  <FlyerPreview url={ev.flyer_url} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{ev.title}</div>
                  {ev.djs?.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {ev.djs.map((d, i) => (
                        <div key={d.id} className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="text-zinc-600 font-bold">{i + 1}.</span>
                          🎧 {d.name}
                          {d.slot_start && <span className="text-zinc-600">{d.slot_start}{d.slot_end ? ` → ${d.slot_end}` : ''}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-zinc-600 mt-1">
                    {safeFormat(ev.start_datetime, 'HH:mm')}
                    {ev.end_datetime && ` → ${safeFormat(ev.end_datetime, 'HH:mm')}`}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => { setEditingEvent(ev); setDayModalOpen(false); setFormOpen(true) }} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">Modifier</button>
                    <button onClick={() => handleDeleteEvent(ev)} className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors">Supprimer</button>
                  </div>
                </div>
                {ev.room_name && (
                  <span className="text-xs font-semibold text-white px-2 py-1 rounded-full self-start flex-shrink-0" style={{ backgroundColor: ev.room_color || '#8b5cf6' }}>
                    {ev.room_name}
                  </span>
                )}
              </div>
            ))}
            <Button variant="primary" className="w-full" onClick={() => { setDayModalOpen(false); setEditingEvent(null); setFormOpen(true) }}>
              + Ajouter un événement
            </Button>
          </div>
        )}
      </Modal>

      <EventForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        event={editingEvent}
        djs={djs}
        rooms={rooms}
        onSaved={fetchEvents}
      />
    </div>
  )
}
