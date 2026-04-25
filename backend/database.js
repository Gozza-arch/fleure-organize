import { db } from './db.js'

async function initDb() {
  // CREATE TABLES (batch)
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS rooms (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL DEFAULT '#6366f1',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS djs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        avatar_url TEXT,
        rating     INTEGER NOT NULL DEFAULT 3,
        notes      TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS dj_genres (
        dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
        genre TEXT NOT NULL,
        PRIMARY KEY (dj_id, genre)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS dj_rooms (
        dj_id   INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        PRIMARY KEY (dj_id, room_id)
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS events (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        title          TEXT NOT NULL,
        dj_id          INTEGER REFERENCES djs(id) ON DELETE SET NULL,
        room_id        INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        start_datetime TEXT NOT NULL,
        end_datetime   TEXT,
        flyer_url      TEXT,
        is_past        INTEGER NOT NULL DEFAULT 0,
        created_at     TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS dj_performance_log (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        dj_id        INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
        room_id      INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        event_id     INTEGER REFERENCES events(id) ON DELETE SET NULL,
        performed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS event_djs (
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        dj_id    INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, dj_id)
      )`,
      args: [],
    },
  ])

  // Migration : peupler event_djs depuis les events existants avec dj_id
  await db.execute({
    sql: `INSERT OR IGNORE INTO event_djs (event_id, dj_id)
          SELECT id, dj_id FROM events WHERE dj_id IS NOT NULL`,
    args: [],
  })

  // Migrations ALTER TABLE (individuelles avec try/catch)
  try { await db.execute({ sql: 'ALTER TABLE event_djs ADD COLUMN order_index INTEGER DEFAULT 0', args: [] }) } catch {}
  try { await db.execute({ sql: 'ALTER TABLE event_djs ADD COLUMN slot_start TEXT', args: [] }) } catch {}
  try { await db.execute({ sql: 'ALTER TABLE event_djs ADD COLUMN slot_end TEXT', args: [] }) } catch {}
  try { await db.execute({ sql: 'ALTER TABLE events ADD COLUMN color TEXT', args: [] }) } catch {}

  // Seed rooms si aucune n'existe
  const countResult = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM rooms', args: [] })
  const cnt = countResult.rows[0]?.cnt ?? 0
  if (Number(cnt) === 0) {
    await db.execute({ sql: "INSERT INTO rooms (name, color) VALUES (?, ?)", args: ['Room 1', '#0d9488'] })
    await db.execute({ sql: "INSERT INTO rooms (name, color) VALUES (?, ?)", args: ['Room 2', '#f59e0b'] })
    await db.execute({ sql: "INSERT INTO rooms (name, color) VALUES (?, ?)", args: ['Room 3', '#ec4899'] })
    console.log('Seeded 3 default rooms.')
  }

  console.log('Database initialised')
}

export { db, initDb }
