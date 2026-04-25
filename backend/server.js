import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb } from './database.js'

import djsRouter      from './routes/djs.js'
import eventsRouter   from './routes/events.js'
import roomsRouter    from './routes/rooms.js'
import archivesRouter from './routes/archives.js'
import uploadsRouter  from './routes/uploads.js'
import dashboardRouter from './routes/dashboard.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isProd     = process.env.NODE_ENV === 'production'
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')

const app = express()

// En dev, autoriser Vite. En prod, même origine donc pas besoin de CORS.
if (!isProd) app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Fichiers uploadés (flyers) — uniquement si pas Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  app.use('/uploads', express.static(UPLOADS_DIR))
}

// Routes API
app.use('/api/djs',       djsRouter)
app.use('/api/events',    eventsRouter)
app.use('/api/rooms',     roomsRouter)
app.use('/api/archives',  archivesRouter)
app.use('/api/uploads',   uploadsRouter)
app.use('/api/dashboard', dashboardRouter)

// En production standalone (pas sur Vercel) : servir le frontend React buildé
if (isProd && !process.env.VERCEL) {
  const frontendDist = path.join(__dirname, '../frontend/dist')
  app.use(express.static(frontendDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

// Initialiser la DB puis démarrer (seulement si pas Vercel)
async function start() {
  await initDb()
  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => console.log(`Fleure Organize running on port ${PORT} [${isProd ? 'production' : 'development'}]`))
  }
}
start().catch(console.error)

export default app
