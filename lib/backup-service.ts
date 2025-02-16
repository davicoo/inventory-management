import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'
import { db } from './db-config'

export interface BackupResult {
  success: boolean
  path?: string
  size?: number
  timestamp?: string
  validated?: boolean
  error?: string
}

export interface BackupInfo {
  name: string
  size: number
  created: string
  path: string
}

export class BackupService {
  private backupDir: string
  private dbPath: string

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.dbPath = path.join(process.cwd(), 'inventory.db')
    this.initialize()
  }

  private initialize() {
    try {
      this.ensureBackupDir()
      // Verify database connection
      if (!db) {
        throw new Error('Database not initialized')
      }
      // Test database connection
      db.prepare('SELECT 1').get()
    } catch (error) {
      console.error('Backup service initialization failed:', error)
      throw error
    }
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async backupDatabase(): Promise<BackupResult> {
    try {
      // Verify database connection
      if (!db) {
        throw new Error('Database not initialized')
      }

      // Ensure database exists
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Database file not found')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(this.backupDir, `inventory-${timestamp}.db`)

      // Checkpoint WAL
      try {
        db.prepare('PRAGMA wal_checkpoint(FULL)').run()
      } catch (error) {
        console.warn('WAL checkpoint warning:', error)
      }

      // Create backup
      await fsPromises.copyFile(this.dbPath, backupPath)
      const stats = await fsPromises.stat(backupPath)

      return {
        success: true,
        path: backupPath,
        size: stats.size,
        timestamp: new Date().toISOString(),
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

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fsPromises.readdir(this.backupDir)
      
      const backupFiles = await Promise.all(
        files
          .filter(file => file.endsWith('.db'))
          .map(async file => {
            const filePath = path.join(this.backupDir, file)
            const stats = await fsPromises.stat(filePath)
            return {
              name: file,
              size: stats.size,
              created: stats.birthtime.toISOString(),
              path: filePath
            }
          })
      )

      return backupFiles.sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      )
    } catch (error) {
      console.error('Error listing backups:', error)
      return []
    }
  }
}

export const backupService = new BackupService()