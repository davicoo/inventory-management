import Database from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import { promises as fsPromises } from 'fs'

const dbPath = path.join(process.cwd(), "inventory.db")

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "")
  console.log("Created new database file")
}

const db = new Database(dbPath)

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

function checkDatabaseHealth() {
  try {
    // Basic connection check
    const result = db.prepare('SELECT 1 as health').get()
    const writeTest = db.prepare('PRAGMA quick_check').get()
    
    // Enhanced statistics query
    const enhancedStats = db.prepare(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(CASE WHEN sold = 1 THEN 1 ELSE 0 END) as soldItems,
        SUM(CASE WHEN paymentReceived = 1 THEN 1 ELSE 0 END) as paidItems,
        COUNT(DISTINCT location) as locations,
        SUM(CASE WHEN price IS NOT NULL THEN price ELSE 0 END) as totalValue,
        AVG(CASE WHEN price IS NOT NULL THEN price ELSE NULL END) as avgPrice,
        COUNT(CASE WHEN created_at >= unixepoch('now', '-7 days') THEN 1 END) as newItemsLastWeek
      FROM items
    `).get()

    // Get storage info
    const storageInfo = {
      dbSize: db.prepare('PRAGMA page_count').get(),
      pageSize: db.prepare('PRAGMA page_size').get(),
      freePages: db.prepare('PRAGMA freelist_count').get()
    }

    const sizeInBytes = (storageInfo.dbSize?.['page_count'] || 0) * (storageInfo.pageSize?.['page_size'] || 0)
    
    return {
      status: 'healthy',
      connection: true,
      write_access: !!writeTest,
      timestamp: new Date().toISOString(),
      statistics: {
        items: {
          total: enhancedStats?.totalItems || 0,
          sold: enhancedStats?.soldItems || 0,
          paid: enhancedStats?.paidItems || 0,
          addedLastWeek: enhancedStats?.newItemsLastWeek || 0,
          totalValue: Number(enhancedStats?.totalValue || 0).toFixed(2),
          averagePrice: Number(enhancedStats?.avgPrice || 0).toFixed(2)
        },
        locations: enhancedStats?.locations || 0,
        database: {
          size: `${(sizeInBytes / 1024).toFixed(2)} KB`,
          freeSpace: `${((storageInfo.freePages?.['freelist_count'] || 0) * (storageInfo.pageSize?.['page_size'] || 0) / 1024).toFixed(2)} KB`,
          tables: ['items'],
          lastBackup: lastBackupTime,
          needsBackup: !lastBackupTime || (Date.now() - new Date(lastBackupTime).getTime() > 24 * 60 * 60 * 1000)
        }
      }
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      connection: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      statistics: null
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
  checkDatabaseHealth,
  backupDatabase,
  listBackups,
  db as default
}

