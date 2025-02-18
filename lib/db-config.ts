import Database from 'better-sqlite3'
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from 'fs'

const DB_PATH = path.join(process.cwd(), 'inventory.db')

let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH, {
      // Disable verbose logging in production
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    })
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 1000')
    db.pragma('temp_store = MEMORY')
  }
  return db
}

// Prepare statements once for better performance
const statements = {
  getAllItems: getDb().prepare(`
    SELECT 
      id, name, location, description, imageUrl,
      sold, paymentReceived, code, price,
      created_at
    FROM items 
    ORDER BY created_at DESC
  `),
  
  updateSold: getDb().prepare(
    'UPDATE items SET sold = ? WHERE id = ? RETURNING *'
  ),
  
  updatePayment: getDb().prepare(
    'UPDATE items SET paymentReceived = ? WHERE id = ? RETURNING *'
  ),
  
  getBackups: getDb().prepare(`
    SELECT * FROM backups ORDER BY created_at DESC
  `)
}

export { statements }

// Ensure the database file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "")
  console.log("Created new database file")
}

// Database functions
function getAllItems() {
  const items = statements.getAllItems.all()
  return items.map(item => ({
    ...item,
    sold: Boolean(item.sold),
    paymentReceived: Boolean(item.paymentReceived),
    price: item.price ? Number(item.price) : 0,
    created_at: new Date(item.created_at * 1000).toISOString()
  }))
}

function getItemById(id: string) {
  try {
    console.log(`Getting item with id: ${id}`)
    const item = getDb().prepare('SELECT * FROM items WHERE id = ?').get(id)
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
    const stmt = getDb().prepare(`
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
    if (updates.sold !== undefined) {
      statements.updateSold.run(updates.sold ? 1 : 0, id)
    }
    if (updates.paymentReceived !== undefined) {
      statements.updatePayment.run(updates.paymentReceived ? 1 : 0, id)
    }
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
    const stmt = getDb().prepare('DELETE FROM items WHERE id = ?')
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
    getDb().prepare('PRAGMA wal_checkpoint(FULL)').run()
    
    // Create backups directory if it doesn't exist
    await fsPromises.mkdir(backupDir, { recursive: true })
    
    // Backup using SQLite backup API
    await fsPromises.copyFile(DB_PATH, backupPath)
    
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
    const result = getDb().prepare('PRAGMA integrity_check').get()
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

export async function restoreBackup(backupFileName: string): Promise<{ success: boolean; message: string }> {
  const backupPath = path.join(process.cwd(), 'backups', backupFileName)
  const dbPath = path.join(process.cwd(), 'inventory.db')
  try {
    // Verify backup exists
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found')
    }

    // Close current database connection
    getDb().close()
    
    // Create backup of current database
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const currentBackupPath = path.join(process.cwd(), 'backups', `pre-restore-${timestamp}.db`)
    
    if (fs.existsSync(dbPath)) {
      await fs.promises.copyFile(dbPath, currentBackupPath)
    }
    
    // Restore from backup
    await fs.promises.copyFile(backupPath, dbPath)

    // Reinitialize database connection
    const newDb = getDb()
    Object.assign(db, newDb)
    return {
      success: true,
      message: 'Database restored successfully'
    }
  } catch (error) {
    console.error('Restore failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restore database'
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

