import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

export interface BackupInfo {
  name: string
  size: number
  created: string
  path: string
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