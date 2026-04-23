export default function FlyerPreview({ url, className = '' }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Flyer"
        className={`object-contain ${className}`}
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex')
        }}
      />
    )
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ${className}`}
    >
      <span className="text-4xl opacity-50">🎵</span>
    </div>
  )
}
