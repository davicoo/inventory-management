import { NextResponse } from "next/server"
import db from "@/lib/db-config"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const updates = await request.json()
    
    console.log(`PATCH /api/items/${id}: Updating item with:`, updates)

    const stmt = db.prepare(`
      UPDATE items 
      SET sold = ?, paymentReceived = ?
      WHERE id = ?
    `)

    stmt.run(
      updates.sold ? 1 : 0,
      updates.paymentReceived ? 1 : 0,
      id
    )

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    
    if (!updatedItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    console.log(`PATCH /api/items/${id}: Successfully updated item:`, updatedItem)
    return NextResponse.json(updatedItem)

  } catch (error) {
    console.error(`PATCH /api/items/${id}: Error updating item:`, error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}

