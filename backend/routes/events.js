import { Router } from 'express'
import { db } from '../db.js'
import { checkRepeatRisk } from '../services/antiRepeatService.js'

const router = Router()

// Base query for event listing with room join
const BASE_SELECT = `
  SELECT e.*,
    r.name  AS room_name,
    r.color AS room_color,
    r.icon  AS room_icon
  FROM events e
  LEFT JOIN rooms r ON r.id = e.room_id
`

// Enrichit un event avec son tableau de DJs depuis event_djs (triés par order_index)
async function withDJs(row) {
  if (!row) return null
  const result = await db.execute({
    sql: `SELECT d.id, d.name, ed.order_index, ed.slot_start, ed.slot_end
          FROM event_djs ed
          JOIN djs d ON d.id = ed.dj_id
          WHERE ed.event_id = ?
          ORDER BY ed.order_index ASC`,
    args: [row.id],
  })
  return { ...row, djs: result.rows }
}

async function withDJsMany(rows) {
  return Promise.all(rows.map(withDJs))
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/events/upcoming  (avant /:id)
router.get('/upcoming', async (req, res) => {
  try {
    const result = await db.execute({
      sql: BASE_SELECT + `WHERE e.start_datetime > datetime('now') ORDER BY e.start_datetime ASC`,
      args: [],
    })
    res.json(await withDJsMany(result.rows))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/events/check-repeat?dj_id=&room_id=
router.get('/check-repeat', async (req, res) => {
  try {
    const result = await checkRepeatRisk(req.query.dj_id, req.query.room_id || null)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/events?from=&to=&room_id=&dj_id=
router.get('/', async (req, res) => {
  try {
    const { from, to, room_id, dj_id } = req.query
    const conditions = []
    const params = []

    if (from) { conditions.push('e.start_datetime >= ?'); params.push(from) }
    if (to)   { conditions.push('e.start_datetime <= ?'); params.push(to) }
    if (room_id) { conditions.push('e.room_id = ?'); params.push(room_id) }
    if (dj_id)   { conditions.push('e.dj_id = ?'); params.push(dj_id) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const result = await db.execute({
      sql: BASE_SELECT + where + ' ORDER BY e.start_datetime DESC',
      args: params,
    })
    res.json(await withDJsMany(result.rows))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: BASE_SELECT + ' WHERE e.id = ?',
      args: [req.params.id],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Event not found' })
    res.json(await withDJs(row))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/events
router.post('/', async (req, res) => {
  const {
    title,
    dj_slots = [],
    room_id,
    start_datetime,
    end_datetime,
    flyer_url,
    color,
    is_past = 0,
  } = req.body

  if (!title) return res.status(400).json({ error: 'title is required' })
  if (!start_datetime) return res.status(400).json({ error: 'start_datetime is required' })

  const primaryDjId = dj_slots.length > 0 ? dj_slots[0].dj_id : null

  try {
    const info = await db.execute({
      sql: `INSERT INTO events (title, dj_id, room_id, start_datetime, end_datetime, flyer_url, color, is_past)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, primaryDjId, room_id || null, start_datetime, end_datetime || null, flyer_url || null, color || null, is_past ? 1 : 0],
    })
    const eventId = Number(info.lastInsertRowid)

    for (const slot of dj_slots) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO event_djs (event_id, dj_id, order_index, slot_start, slot_end) VALUES (?, ?, ?, ?, ?)`,
        args: [eventId, slot.dj_id, slot.order_index ?? 0, slot.slot_start || null, slot.slot_end || null],
      })
      await db.execute({
        sql: `INSERT INTO dj_performance_log (dj_id, room_id, event_id, performed_at) VALUES (?, ?, ?, ?)`,
        args: [slot.dj_id, room_id || null, eventId, start_datetime],
      })
    }

    const rowResult = await db.execute({ sql: BASE_SELECT + ' WHERE e.id = ?', args: [eventId] })
    res.status(201).json(await withDJs(rowResult.rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [req.params.id] })
    const event = existing.rows[0]
    if (!event) return res.status(404).json({ error: 'Event not found' })

    const { title, dj_slots, room_id, start_datetime, end_datetime, flyer_url, color, is_past } = req.body

    const primaryDjId = Array.isArray(dj_slots) && dj_slots.length > 0 ? dj_slots[0].dj_id : null

    await db.execute({
      sql: `UPDATE events SET
              title          = COALESCE(?, title),
              dj_id          = ?,
              room_id        = COALESCE(?, room_id),
              start_datetime = COALESCE(?, start_datetime),
              end_datetime   = COALESCE(?, end_datetime),
              flyer_url      = COALESCE(?, flyer_url),
              color          = ?,
              is_past        = COALESCE(?, is_past)
            WHERE id = ?`,
      args: [
        title || null,
        Array.isArray(dj_slots) ? primaryDjId : event.dj_id,
        room_id !== undefined ? room_id : null,
        start_datetime || null,
        end_datetime || null,
        flyer_url || null,
        color !== undefined ? (color || null) : event.color,
        is_past !== undefined ? (is_past ? 1 : 0) : null,
        event.id,
      ],
    })

    if (Array.isArray(dj_slots)) {
      await db.execute({ sql: 'DELETE FROM event_djs WHERE event_id = ?', args: [event.id] })
      for (const slot of dj_slots) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO event_djs (event_id, dj_id, order_index, slot_start, slot_end) VALUES (?, ?, ?, ?, ?)`,
          args: [event.id, slot.dj_id, slot.order_index ?? 0, slot.slot_start || null, slot.slot_end || null],
        })
      }
    }

    const updatedResult = await db.execute({ sql: BASE_SELECT + ' WHERE e.id = ?', args: [event.id] })
    res.json(await withDJs(updatedResult.rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [req.params.id] })
    const event = existing.rows[0]
    if (!event) return res.status(404).json({ error: 'Event not found' })
    await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
