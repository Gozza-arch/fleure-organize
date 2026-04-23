import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import FlyerPreview from '../events/FlyerPreview.jsx'

function safeFormat(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return format(d, 'dd MMM yyyy', { locale: fr })
  } catch { return dateStr }
}

export default function ArchiveCard({ event, onClick }) {
  const roomColor = event.room_color || event.room?.color || '#8b5cf6'
  const date = event.start_datetime || event.start_date || event.date

  return (
    <div
      onClick={() => onClick(event)}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Flyer */}
      <div className="h-44 overflow-hidden bg-zinc-800">
        <FlyerPreview
          url={event.flyer_url}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-white text-sm leading-tight truncate">
          {event.title || 'Sans titre'}
        </h3>
        {event.djs?.length > 0 && (
          <div className="text-xs text-zinc-500 truncate">
            🎧 {event.djs.map(d => d.name).join(', ')}
          </div>
        )}
        <div className="flex items-center justify-between">
          {(event.room_name || event.room?.name) ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: roomColor }}
            >
              {event.room_name || event.room?.name}
            </span>
          ) : <span />}
          <span className="text-xs text-zinc-600">{safeFormat(date)}</span>
        </div>
      </div>
    </div>
  )
}
