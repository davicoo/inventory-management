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

// Initialize database tables
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
  console.log("Database tables initialized successfully")
} catch (error) {
  console.error("Error initializing database tables:", error)
  throw new Error("Failed to initialize database tables")
}

export default db