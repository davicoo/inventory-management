import { NextResponse } from "next/server"
import db from "@/lib/db-config"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { sold, paymentReceived } = await request.json()

    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE items
        SET sold = ?, paymentReceived = ?
        WHERE id = ?
      `)
      
      stmt.run(sold, paymentReceived, id)
      const updatedItem = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      
      if (!updatedItem) {
        throw new Error("Item not found")
      }
      
      return updatedItem
    })

    const result = transaction()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

