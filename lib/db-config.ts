import Database from "better-sqlite3"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

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

export function getAllItems() {
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

export function getItemById(id: string) {
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

export function createItem(item: {
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

export function updateItem(id: string, updates: { sold?: boolean; paymentReceived?: boolean }) {
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

export function deleteItem(id: string) {
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

export default db

