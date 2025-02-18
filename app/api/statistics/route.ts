import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get basic stats with default values
    const basicStats = db.prepare(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(CASE WHEN sold = 1 THEN 1 ELSE 0 END) as soldItems,
        SUM(CASE WHEN sold = 1 AND paymentReceived = 0 THEN 1 ELSE 0 END) as unpaidItems
      FROM items
    `).get() || { totalItems: 0, soldItems: 0, unpaidItems: 0 }

    // Get sales stats with default value
    const salesStats = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as totalSales
      FROM items
      WHERE sold = 1
    `).get() || { totalSales: 0 }

    // Get monthly sales with empty array default
    const monthlySales = db.prepare(`
      SELECT 
        strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
        COUNT(*) as items,
        COALESCE(SUM(price), 0) as sales
      FROM items
      WHERE sold = 1
      GROUP BY month
      ORDER BY month DESC
    `).all() || []

    return NextResponse.json({
      status: 'success',
      data: {
        totalItems: basicStats.totalItems || 0,
        soldItems: basicStats.soldItems || 0,
        totalSales: salesStats.totalSales || 0,
        unpaidItems: basicStats.unpaidItems || 0,
        salesByMonth: monthlySales
      }
    })
  } catch (error) {
    console.error('Statistics error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}