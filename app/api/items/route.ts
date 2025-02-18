import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import db, { createItem, deleteItem, getAllItems } from "@/lib/db-config"
import fs from "fs/promises"
import path from "path"
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getDb, statements } from "@/lib/db-config"

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/items: Received request")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      console.error("DELETE /api/items: Missing item ID")
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }

    console.log(`DELETE /api/items: Attempting to delete item ${id}`)
    const deletedItem = deleteItem(id)
    
    if (!deletedItem) {
      console.error(`DELETE /api/items: Item ${id} not found`)
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    console.log(`DELETE /api/items: Successfully deleted item ${id}`)
    return NextResponse.json({ message: "Item deleted successfully" })
    
  } catch (error) {
    console.error("DELETE /api/items: Error deleting item:", error)
    return NextResponse.json(
      { error: "Failed to delete item", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const items = statements.getAllItems.all().map(item => ({
      ...item,
      sold: Boolean(item.sold),
      paymentReceived: Boolean(item.paymentReceived),
      price: item.price ? Number(item.price) : 0,
      created_at: new Date(item.created_at * 1000).toISOString()
    }))

    return NextResponse.json({
      status: 'success',
      data: items
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('GET /api/items error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch items'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/items: Received request')
  
  try {
    const contentType = request.headers.get('content-type')
    let data

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      data = Object.fromEntries(formData)
    } else {
      data = await request.json()
    }

    const id = uuidv4()
    const { name, location, description, code, price, imageUrl } = data

    const stmt = db.prepare(`
      INSERT INTO items (id, name, location, description, code, price, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, name, location, description, code, price, imageUrl)

    return NextResponse.json({ 
      status: 'success',
      message: 'Item created successfully',
      id 
    })

  } catch (error) {
    console.error('POST /api/items: Error creating item:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

