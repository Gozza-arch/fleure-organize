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

  let daysSinceLast = null
  if (rid) {
    const lastResult = await db.execute({
      sql: `SELECT MAX(performed_at) as last_date FROM dj_performance_log WHERE dj_id = ? AND room_id = ?`,
      args: [id, rid],
    })
    const lastDate = lastResult.rows[0]?.last_date
    if (lastDate) {
      daysSinceLast = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  let risk = 'none'
  let message = 'Aucun risque de répétition détecté.'

  if (daysSinceLast !== null && daysSinceLast <= 15) {
    risk = 'danger'
    message = `Danger : ce DJ a joué dans cette room il y a seulement ${daysSinceLast} jour${daysSinceLast > 1 ? 's' : ''} (moins de 15 jours).`
  } else if (daysSinceLast !== null && daysSinceLast <= 30) {
    risk = 'warning'
    message = `Attention : ce DJ a joué dans cette room il y a ${daysSinceLast} jours (moins de 30 jours).`
  }

  return { risk, message, totalCount, daysSinceLast }
}

export { getDJStats, checkRepeatRisk }
