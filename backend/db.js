import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
  || `file:${process.env.DB_PATH || './backend/data/fleure.db'}`

export const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})
