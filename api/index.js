import { initDb } from '../backend/database.js'
import app from '../backend/server.js'

// Initialise la DB au démarrage de la fonction serverless
let ready = false
const init = initDb().then(() => { ready = true }).catch(console.error)

export default async function handler(req, res) {
  if (!ready) await init
  return app(req, res)
}
