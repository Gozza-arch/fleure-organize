import { useState, useRef, useEffect } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-xl bg-zinc-700 border border-zinc-600 hover:border-violet-500 flex items-center justify-center text-xl transition-colors"
        title="Choisir un emoji"
      >
        {value || <span className="text-zinc-500 text-sm">+</span>}
      </button>

      {open && (
        <div className="absolute z-50 top-12 left-0">
          <Picker
            data={data}
            onEmojiSelect={(emoji) => { onChange(emoji.native); setOpen(false) }}
            theme="dark"
            locale="fr"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
    </div>
  )
}
