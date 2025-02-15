import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db-config"

export async function GET() {
  const healthStatus = checkDatabaseHealth()
  if (healthStatus.status === "healthy") {
    return NextResponse.json(healthStatus)
  } else {
    return NextResponse.json(healthStatus, { status: 500 })
  }
}

