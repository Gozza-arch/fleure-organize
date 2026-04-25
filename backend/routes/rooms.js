import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM rooms ORDER BY name', args: [] })
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [req.params.id] })
    const room = result.rows[0]
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/rooms
router.post('/', async (req, res) => {
  const { name, color = '#6366f1' } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    const info = await db.execute({ sql: 'INSERT INTO rooms (name, color) VALUES (?, ?)', args: [name, color] })
    const result = await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [Number(info.lastInsertRowid)] })
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/rooms/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [req.params.id] })
    const room = existing.rows[0]
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const { name, color } = req.body
    await db.execute({
      sql: 'UPDATE rooms SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?',
      args: [name || null, color || null, room.id],
    })

    const updated = await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [room.id] })
    res.json(updated.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM rooms WHERE id = ?', args: [req.params.id] })
    const room = existing.rows[0]
    if (!room) return res.status(404).json({ error: 'Room not found' })
    await db.execute({ sql: 'DELETE FROM rooms WHERE id = ?', args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
