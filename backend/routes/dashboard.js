import { Router } from 'express';
import { db } from '../database.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    const totalDJsRow = db.prepare('SELECT COUNT(*) as cnt FROM djs').get();
    const totalEventsRow = db.prepare('SELECT COUNT(*) as cnt FROM events').get();

    const upcomingRow = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM events WHERE start_datetime > datetime('now')`
      )
      .get();

    const pastRow = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM events
         WHERE start_datetime < datetime('now') OR is_past = 1`
      )
      .get();

    // Most active DJ by performance log count
    const mostActiveDJRow = db
      .prepare(
        `SELECT d.name, COUNT(*) as count
         FROM dj_performance_log dpl
         JOIN djs d ON d.id = dpl.dj_id
         GROUP BY dpl.dj_id
         ORDER BY count DESC
         LIMIT 1`
      )
      .get();

    // Top room by event count
    const topRoomRow = db
      .prepare(
        `SELECT r.name, COUNT(*) as count
         FROM events e
         JOIN rooms r ON r.id = e.room_id
         GROUP BY e.room_id
         ORDER BY count DESC
         LIMIT 1`
      )
      .get();

    res.json({
      totalDJs: totalDJsRow ? totalDJsRow.cnt : 0,
      totalEvents: totalEventsRow ? totalEventsRow.cnt : 0,
      upcomingEvents: upcomingRow ? upcomingRow.cnt : 0,
      pastEvents: pastRow ? pastRow.cnt : 0,
      mostActiveDJ: mostActiveDJRow
        ? { name: mostActiveDJRow.name, count: mostActiveDJRow.count }
        : { name: '', count: 0 },
      topRoom: topRoomRow
        ? { name: topRoomRow.name, count: topRoomRow.count }
        : { name: '', count: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
