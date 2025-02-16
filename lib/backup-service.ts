import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'
import { db } from './db-config'

export interface BackupInfo {
  name: string
  size: number
  created: string
  path: string
}

export interface BackupResult {
  success: boolean
  path?: string
  size?: number
  timestamp?: string
  validated?: boolean
  error?: string
}

export class BackupService {
  private backupDir: string

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.ensureBackupDir()
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async backupDatabase(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.backupDir, `inventory-${timestamp}.db`)
    
    try {
      // Ensure database is not busy
      db.prepare('PRAGMA wal_checkpoint(FULL)').run()
      
      // Create backup using SQLite backup API
      await fsPromises.copyFile(
        path.join(process.cwd(), 'inventory.db'),
        backupPath
      )
      
      // Get backup file size
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