import { Router } from 'express'
import { db } from '../db.js'
import { getDJStats, checkRepeatRisk } from '../services/antiRepeatService.js'

const router = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchDJGenres(djId) {
  const result = await db.execute({
    sql: 'SELECT genre FROM dj_genres WHERE dj_id = ? ORDER BY genre',
    args: [djId],
  })
  return result.rows.map((r) => r.genre)
}

async function fetchDJRooms(djId) {
  const result = await db.execute({
    sql: `SELECT r.id, r.name, r.color
          FROM dj_rooms dr
          JOIN rooms r ON r.id = dr.room_id
          WHERE dr.dj_id = ?`,
    args: [djId],
  })
  return result.rows
}

async function buildFullDJ(dj) {
  const [genres, rooms] = await Promise.all([fetchDJGenres(dj.id), fetchDJRooms(dj.id)])
  return { ...dj, genres, rooms }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/djs
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT d.*,
              (SELECT COUNT(*) FROM dj_performance_log WHERE dj_id = d.id) as performance_count
            FROM djs d
            ORDER BY d.name`,
      args: [],
    })
    const djs = result.rows
    const full = await Promise.all(djs.map(buildFullDJ))
    res.json(full)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/djs/:id/stats  (avant /:id)
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await getDJStats(req.params.id)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/djs/:id/conflicts?room_id=
router.get('/:id/conflicts', async (req, res) => {
  try {
    const result = await checkRepeatRisk(req.params.id, req.query.room_id || null)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/djs/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM djs WHERE id = ?', args: [req.params.id] })
    const dj = result.rows[0]
    if (!dj) return res.status(404).json({ error: 'DJ not found' })
    res.json(await buildFullDJ(dj))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/djs
router.post('/', async (req, res) => {
  const { name, avatar_url, rating = 3, notes, genres = [], roomIds = [] } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  try {
    const info = await db.execute({
      sql: 'INSERT INTO djs (name, avatar_url, rating, notes) VALUES (?, ?, ?, ?)',
      args: [name, avatar_url || null, rating, notes || null],
    })
    const djId = Number(info.lastInsertRowid)

    for (const genre of genres) {
      if (genre) await db.execute({ sql: 'INSERT OR IGNORE INTO dj_genres (dj_id, genre) VALUES (?, ?)', args: [djId, genre] })
    }
    for (const roomId of roomIds) {
      if (roomId) await db.execute({ sql: 'INSERT OR IGNORE INTO dj_rooms (dj_id, room_id) VALUES (?, ?)', args: [djId, roomId] })
    }

    const djResult = await db.execute({ sql: 'SELECT * FROM djs WHERE id = ?', args: [djId] })
    res.status(201).json(await buildFullDJ(djResult.rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/djs/:id
router.put('/:id', async (req, res) => {
  const { name, avatar_url, rating, notes, genres = [], roomIds = [] } = req.body

  try {
    const existing = await db.execute({ sql: 'SELECT * FROM djs WHERE id = ?', args: [req.params.id] })
    const dj = existing.rows[0]
    if (!dj) return res.status(404).json({ error: 'DJ not found' })

    await db.execute({
      sql: `UPDATE djs SET
              name       = COALESCE(?, name),
              avatar_url = COALESCE(?, avatar_url),
              rating     = COALESCE(?, rating),
              notes      = COALESCE(?, notes)
            WHERE id = ?`,
      args: [name || null, avatar_url || null, rating || null, notes || null, dj.id],
    })

    await db.execute({ sql: 'DELETE FROM dj_genres WHERE dj_id = ?', args: [dj.id] })
    for (const genre of genres) {
      if (genre) await db.execute({ sql: 'INSERT OR IGNORE INTO dj_genres (dj_id, genre) VALUES (?, ?)', args: [dj.id, genre] })
    }

    await db.execute({ sql: 'DELETE FROM dj_rooms WHERE dj_id = ?', args: [dj.id] })
    for (const roomId of roomIds) {
      if (roomId) await db.execute({ sql: 'INSERT OR IGNORE INTO dj_rooms (dj_id, room_id) VALUES (?, ?)', args: [dj.id, roomId] })
    }

    const updatedResult = await db.execute({ sql: 'SELECT * FROM djs WHERE id = ?', args: [dj.id] })
    res.json(await buildFullDJ(updatedResult.rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/djs/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM djs WHERE id = ?', args: [req.params.id] })
    const dj = existing.rows[0]
    if (!dj) return res.status(404).json({ error: 'DJ not found' })
    await db.execute({ sql: 'DELETE FROM djs WHERE id = ?', args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
