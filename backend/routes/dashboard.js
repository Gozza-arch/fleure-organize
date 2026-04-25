import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalDJsResult, totalEventsResult, upcomingResult, pastResult, mostActiveResult, topRoomResult] =
      await Promise.all([
        db.execute({ sql: 'SELECT COUNT(*) as cnt FROM djs', args: [] }),
        db.execute({ sql: 'SELECT COUNT(*) as cnt FROM events', args: [] }),
        db.execute({ sql: `SELECT COUNT(*) as cnt FROM events WHERE start_datetime > datetime('now')`, args: [] }),
        db.execute({ sql: `SELECT COUNT(*) as cnt FROM events WHERE start_datetime < datetime('now') OR is_past = 1`, args: [] }),
        db.execute({
          sql: `SELECT d.name, COUNT(*) as count
                FROM dj_performance_log dpl
                JOIN djs d ON d.id = dpl.dj_id
                GROUP BY dpl.dj_id
                ORDER BY count DESC
                LIMIT 1`,
          args: [],
        }),
        db.execute({
          sql: `SELECT r.name, COUNT(*) as count
                FROM events e
                JOIN rooms r ON r.id = e.room_id
                GROUP BY e.room_id
                ORDER BY count DESC
                LIMIT 1`,
          args: [],
        }),
      ])

    const totalDJsRow    = totalDJsResult.rows[0]
    const totalEventsRow = totalEventsResult.rows[0]
    const upcomingRow    = upcomingResult.rows[0]
    const pastRow        = pastResult.rows[0]
    const mostActiveRow  = mostActiveResult.rows[0]
    const topRoomRow     = topRoomResult.rows[0]

    res.json({
      totalDJs:       totalDJsRow    ? Number(totalDJsRow.cnt)    : 0,
      totalEvents:    totalEventsRow ? Number(totalEventsRow.cnt)  : 0,
      upcomingEvents: upcomingRow    ? Number(upcomingRow.cnt)     : 0,
      pastEvents:     pastRow        ? Number(pastRow.cnt)         : 0,
      mostActiveDJ:   mostActiveRow  ? { name: mostActiveRow.name, count: Number(mostActiveRow.count) } : { name: '', count: 0 },
      topRoom:        topRoomRow     ? { name: topRoomRow.name,    count: Number(topRoomRow.count) }    : { name: '', count: 0 },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
