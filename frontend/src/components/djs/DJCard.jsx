import StarRating from '../ui/StarRating.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

export default function DJCard({ dj, onEdit, onDelete, onSchedule }) {
  const borderColor = dj.rooms?.[0]?.color || '#8b5cf6'
  const performanceCount = dj.event_count ?? dj.performance_count ?? 0

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-200 px-5 py-4 flex items-center gap-4 cursor-pointer group"
      style={{ borderLeft: `3px solid ${borderColor}` }}
      onClick={() => onSchedule?.(dj)}
    >
      {/* Nom + rating */}
      <div className="w-48 flex-shrink-0">
        <h3 className="font-bold text-white truncate group-hover:text-violet-300 transition-colors">{dj.name}</h3>
        <div className="mt-1">
          <StarRating value={dj.rating || 0} />
        </div>
        <div className="text-xs text-zinc-700 group-hover:text-violet-500/60 transition-colors mt-0.5 font-medium">
          Cliquer pour programmer
        </div>
      </div>

      {/* Genres */}
      <div className="flex-1 hidden md:flex flex-wrap gap-1.5">
        {dj.genres && dj.genres.length > 0
          ? dj.genres.map((genre) => <Badge key={genre} label={genre} />)
          : <span className="text-xs text-zinc-600">—</span>
        }
      </div>

      {/* Rooms */}
      <div className="hidden lg:flex flex-wrap gap-1.5">
        {dj.rooms && dj.rooms.length > 0
          ? dj.rooms.map((room) => (
              <span
                key={room.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300"
              >
                {room.color && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: room.color }} />
                )}
                {room.name}
              </span>
            ))
          : <span className="text-xs text-zinc-600">—</span>
        }
      </div>

      {/* Prestations */}
      <span className="text-xs text-zinc-500 hidden sm:block w-24 text-right flex-shrink-0">
        {performanceCount} prestation{performanceCount !== 1 ? 's' : ''}
      </span>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <Button variant="secondary" size="sm" onClick={() => onEdit(dj)}>Modifier</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(dj)}>Supprimer</Button>
      </div>
    </div>
  )
}
