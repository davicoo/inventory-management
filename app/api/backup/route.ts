import { NextResponse } from "next/server"
import { backupService } from "@/lib/backup-service"

export async function POST() {
  try {
    const result = await backupService.backupDatabase()
    
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
      return NextResponse.json({ 
        status: 'error',
        message: 'Failed to create backup',
        details: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to create backup',
      error: error instanceof Error ? error.message : String(error)
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