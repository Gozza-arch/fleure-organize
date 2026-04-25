import { db } from '../db.js'

/**
 * Get performance statistics for a DJ.
 * @param {number|string} djId
 * @returns {Promise<{ totalPerformances: number, performancesLast30Days: number, roomBreakdown: Array }>}
 */
async function getDJStats(djId) {
  const id = Number(djId)

  const totalResult = await db.execute({
    sql: 'SELECT COUNT(*) as cnt FROM dj_performance_log WHERE dj_id = ?',
    args: [id],
  })

  const last30Result = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM dj_performance_log
          WHERE dj_id = ? AND performed_at >= datetime('now', '-30 days')`,
    args: [id],
  })

  const roomResult = await db.execute({
    sql: `SELECT r.id as room_id, r.name as room_name, COUNT(*) as count
          FROM dj_performance_log dpl
          LEFT JOIN rooms r ON r.id = dpl.room_id
          WHERE dpl.dj_id = ?
          GROUP BY dpl.room_id
          ORDER BY count DESC`,
    args: [id],
  })

  return {
    totalPerformances: totalResult.rows[0] ? Number(totalResult.rows[0].cnt) : 0,
    performancesLast30Days: last30Result.rows[0] ? Number(last30Result.rows[0].cnt) : 0,
    roomBreakdown: roomResult.rows,
  }
}

/**
 * Assess repeat-booking risk for a DJ in a given room.
 * @param {number|string} djId
 * @param {number|string|null} roomId
 * @returns {Promise<{ risk: 'none'|'warning'|'danger', message: string, totalCount: number, roomCount: number }>}
 */
async function checkRepeatRisk(djId, roomId) {
  const id = Number(djId)
  const rid = roomId ? Number(roomId) : null

  const totalResult = await db.execute({
    sql: 'SELECT COUNT(*) as cnt FROM dj_performance_log WHERE dj_id = ?',
    args: [id],
  })
  const totalCount = totalResult.rows[0] ? Number(totalResult.rows[0].cnt) : 0

  let roomCount = 0
  if (rid) {
    const roomResult = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM dj_performance_log WHERE dj_id = ? AND room_id = ?',
      args: [id, rid],
    })
    roomCount = roomResult.rows[0] ? Number(roomResult.rows[0].cnt) : 0
  }

  let risk = 'none'
  let message = 'Aucun risque de répétition détecté.'

  if (totalCount > 10 || roomCount > 6) {
    risk = 'danger'
    message = `Danger : ce DJ a joué ${totalCount} fois au total et ${roomCount} fois dans cette salle. Forte surexposition.`
  } else if (totalCount > 5 || roomCount > 3) {
    risk = 'warning'
    message = `Attention : ce DJ a joué ${totalCount} fois au total et ${roomCount} fois dans cette salle. Rotation à surveiller.`
  }

  return { risk, message, totalCount, roomCount }
}

export { getDJStats, checkRepeatRisk }
