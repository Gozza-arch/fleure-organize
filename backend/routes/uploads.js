import { Router } from 'express';
import upload from '../middleware/upload.js';

const router = Router();

// POST /api/uploads/flyer
router.post('/flyer', (req, res) => {
  upload.single('flyer')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

export default router;
