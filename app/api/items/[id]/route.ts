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

    // First check if item exists
    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    if (!existingItem) {
      console.log(`No item found with id: ${id}`)
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Prepare update query with only the fields that are present
    const updateFields = []
    const values = []
    
    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.location !== undefined) {
      updateFields.push('location = ?')
      values.push(updates.location)
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.price !== undefined) {
      updateFields.push('price = ?')
      values.push(updates.price)
    }
    if (updates.sold !== undefined) {
      updateFields.push('sold = ?')
      values.push(updates.sold ? 1 : 0)
    }
    if (updates.paymentReceived !== undefined) {
      updateFields.push('paymentReceived = ?')
      values.push(updates.paymentReceived ? 1 : 0)
    }

    // Add the id as the last parameter
    values.push(id)

    const updateQuery = `
      UPDATE items 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `

    console.log('Executing update query:', updateQuery, 'with values:', values)

    const stmt = db.prepare(updateQuery)
    stmt.run(...values)

    // Fetch and return the updated item
    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
    console.log(`Successfully updated item:`, updatedItem)
    
    return NextResponse.json(updatedItem)

  } catch (error) {
    console.error(`Error updating item:`, error)
    return NextResponse.json(
      { 
        error: "Failed to update item",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}