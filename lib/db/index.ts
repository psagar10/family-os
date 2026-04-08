import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

// Create libsql client for Turso (cloud SQLite) or local file
const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./data/family-os.db',
})

// Create drizzle instance with the libsql client
export const db = drizzle(libsql, { schema })

// Export schema for convenience
export * from './schema'
