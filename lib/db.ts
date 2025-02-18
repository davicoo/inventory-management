import Database from "better-sqlite3"
import path from "path"

const DB_PATH = path.join(process.cwd(), "inventory.db")

function initializeDatabase() {
  try {
    console.log('Initializing database at:', DB_PATH)
    
    const db = new Database(DB_PATH, { 
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    })

    // Enable foreign keys and WAL mode
    db.pragma("foreign_keys = ON")
    db.pragma("journal_mode = WAL")

    // Test database connection
    db.prepare('SELECT 1').get()
    console.log('Database connection successful')

    // Create items table with proper types
    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        imageUrl TEXT,
        sold INTEGER DEFAULT 0,
        paymentReceived INTEGER DEFAULT 0,
        code TEXT NOT NULL UNIQUE,
        price DECIMAL(10,2),
        created_at INTEGER DEFAULT (unixepoch('now'))
      )
    `)
    console.log('Database schema initialized')

    return db
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

let dbInstance: Database.Database | null = null

export function getDb() {
  if (!dbInstance) {
    dbInstance = initializeDatabase()
  }
  return dbInstance
}

export const db = getDb()