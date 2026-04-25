import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

const fileFilter = (req, file, cb) => {
  allowedMimes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Seules les images sont autorisées (jpeg, png, gif, webp, svg).'), false)
}

const limits = { fileSize: 10 * 1024 * 1024 } // 10 MB

// En prod (Cloudinary) : memory storage
// En dev (local) : disk storage
const storage = process.env.CLOUDINARY_CLOUD_NAME
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, process.env.UPLOADS_DIR || path.join(__dirname, '../uploads')),
      filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname).toLowerCase()),
    })

export default multer({ storage, fileFilter, limits })
