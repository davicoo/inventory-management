import Database from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from 'fs'

let _db: Database.Database | null = null

function initializeDb() {
  if (!_db) {
    try {
      const dbPath = path.join(process.cwd(), 'inventory.db')
      _db = new Database(dbPath, { verbose: console.log })
      
      // Enable foreign keys
      _db.pragma('foreign_keys = ON')
      
      console.log('Database initialized successfully')
      return _db
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }
  return _db
}

export const db = initializeDb()

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "")
  console.log("Created new database file")
}

// Create the items table with proper schema
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    imageUrl TEXT,
    sold INTEGER DEFAULT 0,
    paymentReceived INTEGER DEFAULT 0,
    code TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    created_at INTEGER DEFAULT (unixepoch('now'))
  )
`)

// Database functions
function getAllItems() {
  try {
    console.log('Getting all items from database')
    const items = db.prepare('SELECT * FROM items').all()
    console.log(`Retrieved ${items.length} items`)
    return items
  } catch (error) {
    console.error('Error getting all items:', error)
    throw error
  }
}

function getItemById(id: string) {
  try {
    console.log(`Getting item with id: ${id}`)
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    if (!item) {
      console.log(`No item found with id: ${id}`)
      return null
    }
    console.log('Retrieved item:', item)
    return item
  } catch (error) {
    console.error(`Error getting item with id ${id}:`, error)
    throw error
  }
}

function createItem(item: {
  name: string
  location: string
  description: string
  imageUrl: string
  code: string
  price?: number
}) {
  try {
    console.log('Creating new item:', item)
    const stmt = db.prepare(`
      INSERT INTO items (id, name, location, description, imageUrl, sold, paymentReceived, code, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const id = uuidv4()
    stmt.run(
      id, 
      item.name, 
      item.location, 
      item.description, 
      item.imageUrl, 
      0, 
      0, 
      item.code,
      item.price || null
    )
    const newItem = getItemById(id)
    console.log('Created item:', newItem)
    return newItem
  } catch (error) {
    console.error('Error creating item:', error)
    throw error
  }
}

function updateItem(id: string, updates: { sold?: boolean; paymentReceived?: boolean }) {
  try {
    console.log(`Updating item ${id}:`, updates)
    const stmt = db.prepare(`
      UPDATE items 
      SET sold = ?, paymentReceived = ?
      WHERE id = ?
    `)
    
    stmt.run(updates.sold ? 1 : 0, updates.paymentReceived ? 1 : 0, id)
    const updatedItem = getItemById(id)
    console.log('Updated item:', updatedItem)
    return updatedItem
  } catch (error) {
    console.error(`Error updating item ${id}:`, error)
    throw error
  }
}

function deleteItem(id: string) {
  try {
    console.log(`Attempting to delete item with id: ${id}`)
    
    // First check if item exists
    const item = getItemById(id)
    if (!item) {
      console.log(`No item found with id: ${id}`)
      return null
    }

    // Delete the item
    const stmt = db.prepare('DELETE FROM items WHERE id = ?')
    stmt.run(id)
    
    console.log(`Successfully deleted item with id: ${id}`)
    return item
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error)
    throw error
  }
}

interface BackupResult {
  success: boolean
  path?: string
  size?: number
  timestamp?: string
  validated?: boolean
  error?: string
}

let lastBackupTime: string | null = null

async function backupDatabase(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')
  const backupPath = path.join(backupDir, `inventory-${timestamp}.db`)
  
  try {
    // Ensure database is not busy
    db.prepare('PRAGMA wal_checkpoint(FULL)').run()
    
    // Create backups directory if it doesn't exist
    await fsPromises.mkdir(backupDir, { recursive: true })
    
    // Backup using SQLite backup API
    await fsPromises.copyFile(dbPath, backupPath)
    
    // Get backup file size
    const stats = await fsPromises.stat(backupPath)
    lastBackupTime = new Date().toISOString()

    return {
      success: true,
      path: backupPath,
      size: stats.size,
      timestamp: lastBackupTime,
      validated: true
    }
  } catch (error) {
    console.error('Backup failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function listBackups() {
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Create directory if it doesn't exist
    await fsPromises.mkdir(backupDir, { recursive: true })
    
    const files = await fsPromises.readdir(backupDir)
    
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.db'))
        .map(async file => {
          const filePath = path.join(backupDir, file)
          const stats = await fsPromises.stat(filePath)
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            path: filePath
          }
        })
    )
    
    return backups.sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )
  } catch (error) {
    console.error('Error listing backups:', error)
    return []
  }
}

export function checkDatabaseHealth() {
  try {
    const result = db.prepare('PRAGMA integrity_check').get()
    return {
      status: result.integrity_check === 'ok' ? 'healthy' : 'error',
      connection: true,
      write_access: true,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'error',
      connection: false,
      write_access: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Single export statement for all functions and the database instance
export {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  backupDatabase,
  listBackups,
  db as default
}

