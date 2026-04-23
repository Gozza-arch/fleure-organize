import { useState } from 'react'

export default function StarRating({ value = 0, onChange }) {
  const [hovered, setHovered] = useState(null)
  const interactive = typeof onChange === 'function'
  const display = hovered !== null ? hovered : value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(null)}
          className={`text-xl leading-none transition-transform ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <span className={display >= star ? 'text-amber-400' : 'text-zinc-700'}>
            {display >= star ? '★' : '★'}
          </span>
        </button>
      ))}
    </div>
  )
}
