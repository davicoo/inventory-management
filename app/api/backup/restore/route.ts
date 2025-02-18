import { NextResponse } from "next/server"
import { promises as fs } from 'fs'
import path from 'path'
import { db } from "@/lib/db-config"

export async function POST(request: Request) {
  console.log('Starting restore process...')
  
  try {
    const { filename } = await request.json()
    
    if (!filename) {
      return NextResponse.json({
        status: 'error',
        message: 'Filename is required'
      }, { status: 400 })
    }

    const backupPath = path.join(process.cwd(), 'backups', filename)
    const dbPath = path.join(process.cwd(), 'inventory.db')

    // Check file permissions and existence
    try {
      await fs.access(backupPath, fs.constants.R_OK)
      await fs.access(path.dirname(dbPath), fs.constants.W_OK)
    } catch (error) {
      console.error('Permission error:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Cannot access required files'
      }, { status: 403 })
    }

    // Create safety backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safetyPath = path.join(process.cwd(), 'backups', `pre-restore-${timestamp}.db`)
    
    // Close current connection
    db.close()
    console.log('Closed existing database connection')

    // Perform restore
    try {
      await fs.copyFile(backupPath, dbPath)
      console.log('Restored database from backup')
    } catch (error) {
      console.error('Restore failed:', error)
      // Try to restore from safety backup if it exists
      if (await fs.stat(safetyPath).catch(() => null)) {
        await fs.copyFile(safetyPath, dbPath)
        throw new Error('Restore failed - reverted to previous state')
      }
      throw new Error('Restore failed - could not copy backup file')
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database restored successfully'
    })

  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to restore backup'
    }, { status: 500 })
  }
}