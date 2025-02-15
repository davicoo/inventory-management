import { NextResponse } from "next/server"
import db from "@/lib/db-config"

export async function GET() {
  try {
    // First verify the table structure
    const tableInfo = db.prepare("PRAGMA table_info(items)").all()
    console.log("Table structure:", tableInfo)

    // Simplified basic stats query
    const basicStats = db.prepare(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(CASE WHEN sold = 1 THEN 1 ELSE 0 END) as soldItems,
        SUM(CASE WHEN sold = 1 AND paymentReceived = 0 THEN 1 ELSE 0 END) as unpaidItems
      FROM items
    `).get()

    console.log("Basic stats:", basicStats)

    // Simplified sales total
    const salesStats = db.prepare(`
      SELECT SUM(COALESCE(price, 0)) as totalSales
      FROM items 
      WHERE sold = 1
    `).get()

    console.log("Sales stats:", salesStats)

    // Simplified monthly sales
    const salesByMonth = db.prepare(`
      SELECT 
        strftime('%Y-%m', datetime(created_at, 'unixepoch')) as month,
        COUNT(*) as items,
        SUM(COALESCE(price, 0)) as sales
      FROM items
      WHERE sold = 1
      AND created_at IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all()

    console.log("Monthly sales:", salesByMonth)

    const stats = {
      totalItems: Number(basicStats?.totalItems || 0),
      soldItems: Number(basicStats?.soldItems || 0),
      totalSales: Number(salesStats?.totalSales || 0),
      unpaidItems: Number(basicStats?.unpaidItems || 0),
      salesByMonth: (salesByMonth || []).map(m => ({
        month: m.month || 'Unknown',
        sales: Number(m.sales || 0),
        items: Number(m.items || 0)
      }))
    }

    console.log("Final stats:", stats)
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Detailed error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}