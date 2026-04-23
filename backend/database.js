import { Database } from 'bun:sqlite';
import path from 'path';

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(import.meta.dir, 'data', 'fleure.db');

const db = new Database(dbPath);

function initDb() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      color     TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS djs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      avatar_url TEXT,
      rating     INTEGER NOT NULL DEFAULT 3,
      notes      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dj_genres (
      dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
      genre TEXT NOT NULL,
      PRIMARY KEY (dj_id, genre)
    );

    CREATE TABLE IF NOT EXISTS dj_rooms (
      dj_id   INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      PRIMARY KEY (dj_id, room_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT NOT NULL,
      dj_id            INTEGER REFERENCES djs(id) ON DELETE SET NULL,
      room_id          INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      start_datetime   TEXT NOT NULL,
      end_datetime     TEXT,
      flyer_url        TEXT,
      is_past          INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dj_performance_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id        INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
      room_id      INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      event_id     INTEGER REFERENCES events(id) ON DELETE SET NULL,
      performed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_djs (
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      dj_id    INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, dj_id)
    );
  `);

  // Migration : peupler event_djs depuis les events existants avec dj_id
  db.exec(`
    INSERT OR IGNORE INTO event_djs (event_id, dj_id)
    SELECT id, dj_id FROM events WHERE dj_id IS NOT NULL;
  `);

  // Migration : colonnes supplémentaires pour order_index et slots horaires
  try { db.exec('ALTER TABLE event_djs ADD COLUMN order_index INTEGER DEFAULT 0') } catch {}
  try { db.exec('ALTER TABLE event_djs ADD COLUMN slot_start TEXT') } catch {}
  try { db.exec('ALTER TABLE event_djs ADD COLUMN slot_end TEXT') } catch {}
  try { db.exec('ALTER TABLE events ADD COLUMN color TEXT') } catch {}

  // Seed rooms if none exist
  const roomCount = db.prepare('SELECT COUNT(*) as cnt FROM rooms').get();
  if (roomCount.cnt === 0) {
    const insertRoom = db.prepare(
      'INSERT INTO rooms (name, color) VALUES (?, ?)'
    );
    const seedRooms = db.transaction(() => {
      insertRoom.run('Room 1', '#0d9488');
      insertRoom.run('Room 2', '#f59e0b');
      insertRoom.run('Room 3', '#ec4899');
    });
    seedRooms();
    console.log('Seeded 3 default rooms.');
  }

  console.log('Database initialised at', dbPath);
}

export { db, initDb };
