import { db } from '../lib/database'
import fs from 'fs/promises'
import path from 'path'

async function setup() {
  try {
    const dirs = ['backups', 'public/uploads']
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true })
    }

    // Initialize database
    db.initialize()
    
    console.log('Setup completed successfully')
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

setup()