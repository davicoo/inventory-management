import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

class DatabaseManager {
  private static instance: Database.Database | null = null
  private static dbPath = path.join(process.cwd(), 'inventory.db')
  private static backupsDir = path.join(process.cwd(), 'backups')

  static initialize() {
    if (!this.instance) {
      console.log('Initializing database connection...')
      
      // Ensure directories exist
      if (!fs.existsSync(this.backupsDir)) {
        fs.mkdirSync(this.backupsDir, { recursive: true })
      }

      this.instance = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      })

      // Configure database
      this.instance.pragma('journal_mode = WAL')
      this.instance.pragma('foreign_keys = ON')

      // Initialize schema
      this.initializeSchema()

      console.log('Database initialized successfully')
    }
    return this.instance
  }

  static getInstance(): Database.Database {
    return this.initialize()
  }

  static close() {
    if (this.instance) {
      this.instance.close()
      this.instance = null
    }
  }

  private static initializeSchema() {
    this.instance?.exec(`
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
      );

      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch('now'))
      );
    `)
  }
}

// Export prepared statements for better performance
const db = DatabaseManager.getInstance()

export const statements = {
  getAllItems: db.prepare(`
    SELECT * FROM items ORDER BY created_at DESC
  `),
  
  getItem: db.prepare(`
    SELECT * FROM items WHERE id = ?
  `),
  
  updateSold: db.prepare(`
    UPDATE items SET sold = ? WHERE id = ? RETURNING *
  `),
  
  updatePayment: db.prepare(`
    UPDATE items SET paymentReceived = ? WHERE id = ? RETURNING *
  `),
  
  listBackups: db.prepare(`
    SELECT * FROM backups ORDER BY created_at DESC
  `),
  
  createBackup: db.prepare(`
    INSERT INTO backups (id, filename, size) VALUES (?, ?, ?)
  `)
}

export { DatabaseManager as db }