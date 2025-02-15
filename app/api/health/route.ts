import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db-config"

export async function GET() {
  try {
    const healthStatus = checkDatabaseHealth()
    
    return NextResponse.json({
      status: 'ok',
      database: healthStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }, {
      status: healthStatus.status === 'healthy' ? 200 : 503
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    })
  }
}

