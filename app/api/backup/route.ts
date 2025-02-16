import { NextResponse } from "next/server"
import { backupService } from "@/lib/backup-service"
import path from 'path'
import fs from 'fs'

console.log('Database path:', path.join(process.cwd(), 'inventory.db'))
console.log('Database exists:', fs.existsSync(path.join(process.cwd(), 'inventory.db')))

export async function POST() {
  console.log('Backup request received')
  
  try {
    const result = await backupService.backupDatabase()
    console.log('Backup result:', result)
    
    if (result.success) {
      return NextResponse.json({ 
        status: 'success',
        message: 'Database backup created successfully',
        details: {
          path: result.path,
          size: result.size,
          timestamp: result.timestamp,
          validated: result.validated
        }
      })
    } else {
      console.error('Backup operation failed:', result.error)
      return NextResponse.json({ 
        status: 'error',
        message: result.error || 'Failed to create backup'
      }, { status: 500 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Unexpected error during backup:', errorMessage)
    return NextResponse.json({ 
      status: 'error',
      message: 'An unexpected error occurred',
      error: errorMessage
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const backups = await backupService.listBackups()
    return NextResponse.json({ 
      status: 'success',
      backups
    })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to list backups',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}