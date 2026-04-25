import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// GET /api/archives?search=&dj_id=&room_id=&from=&to=
router.get('/', async (req, res) => {
  try {
    const { search, dj_id, room_id, from, to } = req.query
    const conditions = ["(e.start_datetime < datetime('now') OR e.is_past = 1)"]
    const params = []

    if (search) {
      conditions.push('(e.title LIKE ? OR d.name LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (dj_id)   { conditions.push('e.dj_id = ?');              params.push(dj_id) }
    if (room_id) { conditions.push('e.room_id = ?');            params.push(room_id) }
    if (from)    { conditions.push('e.start_datetime >= ?');     params.push(from) }
    if (to)      { conditions.push('e.start_datetime <= ?');     params.push(to) }

    const where = 'WHERE ' + conditions.join(' AND ')

    const result = await db.execute({
      sql: `SELECT e.*,
              d.name  AS dj_name,
              r.name  AS room_name,
              r.color AS room_color,
              r.icon  AS room_icon
            FROM events e
            LEFT JOIN djs   d ON d.id = e.dj_id
            LEFT JOIN rooms r ON r.id = e.room_id
            ${where}
            ORDER BY e.start_datetime DESC`,
      args: params,
    })

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/archives/stats
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM events WHERE start_datetime < datetime('now') OR is_past = 1`,
      args: [],
    })

    const distinctDJsResult = await db.execute({
      sql: `SELECT COUNT(DISTINCT dj_id) as total FROM events
            WHERE (start_datetime < datetime('now') OR is_past = 1) AND dj_id IS NOT NULL`,
      args: [],
    })

    const perRoomResult = await db.execute({
      sql: `SELECT r.id, r.name, r.color, COUNT(*) as count
            FROM events e
            JOIN rooms r ON r.id = e.room_id
            WHERE e.start_datetime < datetime('now') OR e.is_past = 1
            GROUP BY e.room_id
            ORDER BY count DESC`,
      args: [],
    })

    const totalRow    = totalResult.rows[0]
    const distinctRow = distinctDJsResult.rows[0]

    res.json({
      totalPastEvents: totalRow    ? Number(totalRow.total)    : 0,
      distinctDJs:     distinctRow ? Number(distinctRow.total) : 0,
      eventsPerRoom:   perRoomResult.rows,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
