import Database from "better-sqlite3"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const dbPath = path.join(process.cwd(), "inventory.db")

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "")
  console.log("Created new database file")
}

let db: Database.Database

try {
  db = new Database(dbPath)
  console.log("Database connection established successfully")
} catch (error) {
  console.error("Error connecting to database:", error)
  throw new Error("Failed to connect to the database")
}

// Create the items table if it doesn't exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT,
      sold BOOLEAN DEFAULT FALSE,
      paymentReceived BOOLEAN DEFAULT FALSE,
      code TEXT NOT NULL
    )
  `)
  console.log("Items table created or already exists")
} catch (error) {
  console.error("Error creating items table:", error)
  throw new Error("Failed to create items table")
}

export function checkDatabaseHealth() {
  try {
    const result = db.prepare("SELECT 1").get()
    return { status: "healthy", message: "Database connection successful" }
  } catch (error) {
    console.error("Database health check failed:", error)
    return { status: "unhealthy", message: "Database connection failed" }
  }
}

export async function saveImage(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()
    const fileName = `${uuidv4()}-${file.name}`
    const filePath = path.join(process.cwd(), "public", "uploads", fileName)

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, Buffer.from(buffer))

    console.log("Image saved successfully:", fileName)
    return `/uploads/${fileName}`
  } catch (error) {
    console.error("Error saving image:", error)
    throw new Error("Failed to save image")
  }
}

export default db

