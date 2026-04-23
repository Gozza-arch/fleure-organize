import { Router } from 'express';
import { db } from '../database.js';
import { getDJStats, checkRepeatRisk } from '../services/antiRepeatService.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetchDJGenres(djId) {
  return db
    .prepare('SELECT genre FROM dj_genres WHERE dj_id = ? ORDER BY genre')
    .all(djId)
    .map((r) => r.genre);
}

function fetchDJRooms(djId) {
  return db
    .prepare(
      `SELECT r.id, r.name, r.color
       FROM dj_rooms dr
       JOIN rooms r ON r.id = dr.room_id
       WHERE dr.dj_id = ?`
    )
    .all(djId);
}

function buildFullDJ(dj) {
  return {
    ...dj,
    genres: fetchDJGenres(dj.id),
    rooms: fetchDJRooms(dj.id),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/djs
router.get('/', (req, res) => {
  try {
    const djs = db
      .prepare(
        `SELECT d.*,
           (SELECT COUNT(*) FROM dj_performance_log WHERE dj_id = d.id) as performance_count
         FROM djs d
         ORDER BY d.name`
      )
      .all();

    const result = djs.map(buildFullDJ);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/djs/:id/stats  (must come before /:id to avoid shadowing)
router.get('/:id/stats', (req, res) => {
  try {
    const stats = getDJStats(req.params.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/djs/:id/conflicts?room_id=
router.get('/:id/conflicts', (req, res) => {
  try {
    const result = checkRepeatRisk(req.params.id, req.query.room_id || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/djs/:id
router.get('/:id', (req, res) => {
  try {
    const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(req.params.id);
    if (!dj) return res.status(404).json({ error: 'DJ not found' });
    res.json(buildFullDJ(dj));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/djs
router.post('/', (req, res) => {
  const { name, avatar_url, rating = 3, notes, genres = [], roomIds = [] } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const insertDJ = db.prepare(
      'INSERT INTO djs (name, avatar_url, rating, notes) VALUES (?, ?, ?, ?)'
    );
    const insertGenre = db.prepare(
      'INSERT OR IGNORE INTO dj_genres (dj_id, genre) VALUES (?, ?)'
    );
    const insertRoom = db.prepare(
      'INSERT OR IGNORE INTO dj_rooms (dj_id, room_id) VALUES (?, ?)'
    );

    const create = db.transaction(() => {
      const info = insertDJ.run(name, avatar_url || null, rating, notes || null);
      const djId = info.lastInsertRowid;
      for (const genre of genres) {
        if (genre) insertGenre.run(djId, genre);
      }
      for (const roomId of roomIds) {
        if (roomId) insertRoom.run(djId, roomId);
      }
      return djId;
    });

    const djId = create();
    const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(djId);
    res.status(201).json(buildFullDJ(dj));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/djs/:id
router.put('/:id', (req, res) => {
  const { name, avatar_url, rating, notes, genres = [], roomIds = [] } = req.body;

  try {
    const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(req.params.id);
    if (!dj) return res.status(404).json({ error: 'DJ not found' });

    const updateDJ = db.prepare(
      `UPDATE djs SET
         name       = COALESCE(?, name),
         avatar_url = COALESCE(?, avatar_url),
         rating     = COALESCE(?, rating),
         notes      = COALESCE(?, notes)
       WHERE id = ?`
    );
    const deleteGenres = db.prepare('DELETE FROM dj_genres WHERE dj_id = ?');
    const insertGenre  = db.prepare('INSERT OR IGNORE INTO dj_genres (dj_id, genre) VALUES (?, ?)');
    const deleteRooms  = db.prepare('DELETE FROM dj_rooms WHERE dj_id = ?');
    const insertRoom   = db.prepare('INSERT OR IGNORE INTO dj_rooms (dj_id, room_id) VALUES (?, ?)');

    const update = db.transaction(() => {
      updateDJ.run(name || null, avatar_url || null, rating || null, notes || null, dj.id);
      deleteGenres.run(dj.id);
      for (const genre of genres) {
        if (genre) insertGenre.run(dj.id, genre);
      }
      deleteRooms.run(dj.id);
      for (const roomId of roomIds) {
        if (roomId) insertRoom.run(dj.id, roomId);
      }
    });

    update();
    const updated = db.prepare('SELECT * FROM djs WHERE id = ?').get(dj.id);
    res.json(buildFullDJ(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/djs/:id
router.delete('/:id', (req, res) => {
  try {
    const dj = db.prepare('SELECT * FROM djs WHERE id = ?').get(req.params.id);
    if (!dj) return res.status(404).json({ error: 'DJ not found' });
    db.prepare('DELETE FROM djs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
