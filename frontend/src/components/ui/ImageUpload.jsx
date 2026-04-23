import { useState, useRef } from 'react'
import axios from 'axios'

export default function ImageUpload({ value, onChange }) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Veuillez sélectionner un fichier image.'); return }
    setError(null)
    setUploading(true)
    setProgress(0)
    const formData = new FormData()
    formData.append('flyer', file)
    try {
      const response = await axios.post('/api/uploads/flyer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)) }
      })
      onChange(response.data.url || response.data.path)
    } catch (err) {
      setError('Erreur lors de l\'upload. Veuillez réessayer.')
      console.error(err)
    } finally { setUploading(false) }
  }

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }

  return (
    <div className="space-y-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
          uploading
            ? 'border-violet-500/50 bg-violet-900/10 cursor-wait'
            : 'border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-800/50 cursor-pointer'
        }`}
      >
        {value ? (
          <div className="relative h-48">
            <img src={value} alt="Flyer" className="w-full h-full object-cover" />
            {!uploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Changer le flyer</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm font-medium text-zinc-400">Cliquer ou glisser un flyer</span>
            <span className="text-xs text-zinc-600">PNG, JPG, WEBP acceptés</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center gap-3">
            <div className="text-sm text-violet-400 font-medium">Upload en cours... {progress}%</div>
            <div className="w-48 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 px-3 py-2 rounded-xl">{error}</div>
      )}

      {value && !uploading && (
        <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:text-red-400 transition-colors">
          Supprimer le flyer
        </button>
      )}
    </div>
  )
}
