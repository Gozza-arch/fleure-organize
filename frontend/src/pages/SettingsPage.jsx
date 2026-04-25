import { useState, useEffect } from 'react'
import Button from '../components/ui/Button.jsx'
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms.js'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border ${
      type === 'success'
        ? 'bg-emerald-900/90 border-emerald-700 text-emerald-300'
        : 'bg-red-900/90 border-red-700 text-red-300'
    }`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  )
}

export default function SettingsPage() {
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [newRoom, setNewRoom] = useState({ name: '', color: '#8b5cf6', icon: '' })
  const [addingRoom, setAddingRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)

  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchRooms = () => {
    setRoomsLoading(true)
    getRooms().then(d => setRooms(Array.isArray(d) ? d : d.rooms || [])).catch(() => setRooms([]).finally(() => setRoomsLoading(false)))
    .finally(() => setRoomsLoading(false))
  }
  useEffect(() => { fetchRooms() }, [])

  const handleAddRoom = async (e) => {
    e.preventDefault()
    if (!newRoom.name.trim()) return
    setAddingRoom(true)
    try { await createRoom(newRoom); setNewRoom({ name: '', color: '#8b5cf6', icon: '' }); fetchRooms(); showToast('Room ajoutée !') }
    catch (err) { showToast(err.response?.data?.message || 'Erreur.', 'error') }
    finally { setAddingRoom(false) }
  }

  const handleUpdateRoom = async (id) => {
    if (!editingRoom) return
    try { await updateRoom(id, { name: editingRoom.name, color: editingRoom.color }); setEditingRoom(null); fetchRooms(); showToast('Room mise à jour !') }
    catch { showToast('Erreur lors de la mise à jour.', 'error') }
  }

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Supprimer la room "${room.name}" ?`)) return
    try { await deleteRoom(room.id); fetchRooms(); showToast('Room supprimée.') }
    catch { showToast('Erreur.', 'error') }
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition'
  const labelCls = 'block text-sm font-medium text-zinc-300 mb-1.5'

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Paramètres</h1>

      {/* Rooms */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5">Rooms</h2>

        {roomsLoading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
            Chargement...
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.length === 0 && <div className="text-zinc-600 text-sm">Aucune room configurée.</div>}

            {rooms.map(room => (
              <div key={room.id} className="flex items-center gap-4 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl">
                {editingRoom?.id === room.id ? (
                  <>
                    <input type="color" value={editingRoom.color} onChange={e => setEditingRoom(r => ({ ...r, color: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer flex-shrink-0" />
                    <input
                      type="text"
                      value={editingRoom.icon}
                      onChange={e => setEditingRoom(r => ({ ...r, icon: e.target.value }))}
                      placeholder="🎵"
                      title="Windows : Win + .  —  Mac : Cmd + Ctrl + Espace"
                      className="w-16 bg-zinc-700 border border-zinc-600 text-white text-center rounded-lg px-2 py-1.5 text-lg focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                    <input
                      type="text"
                      value={editingRoom.name}
                      onChange={e => setEditingRoom(r => ({ ...r, name: e.target.value }))}
                      className="flex-1 bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                      onKeyDown={e => e.key === 'Enter' && handleUpdateRoom(room.id)}
                    />
                    <button onClick={() => handleUpdateRoom(room.id)} className="text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors">✓</button>
                    <button onClick={() => setEditingRoom(null)} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">✕</button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: room.color || '#8b5cf6' }} />
                    {room.icon && <span className="text-base flex-shrink-0">{room.icon}</span>}
                    <span className="flex-1 font-medium text-zinc-300 text-sm">{room.name}</span>
                    <button onClick={() => setEditingRoom({ id: room.id, name: room.name, color: room.color || '#8b5cf6', icon: room.icon || '' })} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">Modifier</button>
                    <button onClick={() => handleDeleteRoom(room)} className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors">Supprimer</button>
                  </>
                )}
              </div>
            ))}

            {/* Add room */}
            <form onSubmit={handleAddRoom} className="flex items-center gap-3 pt-2">
              <input type="color" value={newRoom.color} onChange={e => setNewRoom(r => ({ ...r, color: e.target.value }))} className="w-9 h-9 rounded-lg cursor-pointer flex-shrink-0" />
              <input
                type="text"
                value={newRoom.icon}
                onChange={e => setNewRoom(r => ({ ...r, icon: e.target.value }))}
                placeholder="🎵"
                title="Windows : Win + .  —  Mac : Cmd + Ctrl + Espace"
                className="w-16 bg-zinc-800 border border-zinc-700 text-white text-center placeholder-zinc-600 rounded-xl px-2 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition"
              />
              <input
                type="text"
                value={newRoom.name}
                onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
                placeholder="Nom de la nouvelle room..."
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition"
              />
              <Button variant="primary" type="submit" size="sm" loading={addingRoom} disabled={!newRoom.name.trim()}>
                Ajouter
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Anti-repeat info */}
      <div className="bg-zinc-900 border border-violet-500/20 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          🔁 Anti-répétition
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Le système analyse les performances passées d'un DJ dans une room et affiche des alertes lors de la planification.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <div className="font-semibold text-amber-400 text-sm">Avertissement</div>
              <div className="text-amber-500/70 text-xs mt-0.5">Le DJ a joué dans cette room il y a moins de 30 jours.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/30 rounded-xl p-4">
            <span className="text-xl flex-shrink-0">❌</span>
            <div>
              <div className="font-semibold text-red-400 text-sm">Danger — Répétition trop rapprochée</div>
              <div className="text-red-500/70 text-xs mt-0.5">Le DJ a joué dans cette room il y a moins de 15 jours.</div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
