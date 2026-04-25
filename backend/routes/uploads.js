import { Router } from 'express'
import upload from '../middleware/upload.js'
import { v2 as cloudinary } from 'cloudinary'

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
  })
}

const router = Router()

// POST /api/uploads/flyer
router.post('/flyer', (req, res) => {
  upload.single('flyer')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Si Cloudinary configuré → upload cloud
    if (process.env.CLOUDINARY_CLOUD_NAME && req.file.buffer) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'fleure-organize', resource_type: 'image' },
            (error, result) => error ? reject(error) : resolve(result)
          ).end(req.file.buffer)
        })
        return res.json({ url: result.secure_url })
      } catch (uploadErr) {
        return res.status(500).json({ error: uploadErr.message })
      }
    }

    // Sinon → local disk (dev)
    res.json({ url: `/uploads/${req.file.filename}` })
  })
})

export default router
