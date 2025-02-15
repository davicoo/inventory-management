import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import db, { createItem, getAllItems, deleteItem } from "@/lib/db-config"
import fs from "fs/promises"
import path from "path"

// Add this new function
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
    console.log("GET /api/items: Attempting to fetch items from database")
    const items = getAllItems()
    console.log(`GET /api/items: Successfully fetched ${items.length} items`)
    return NextResponse.json(items)
  } catch (error) {
    console.error("GET /api/items: Error fetching items:", error)
    return NextResponse.json(
      { error: "Failed to fetch items", details: String(error) }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/items: Received request")
    const formData = await request.formData()
    
    // Log received data
    console.log("POST /api/items: Form data received:", Object.fromEntries(formData))
    
    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const image = formData.get("image") as File | null
    
    if (!name || !location) {
      console.error("POST /api/items: Missing required fields")
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      )
    }

    let imageUrl = ""
    if (image) {
      try {
        // Handle image upload here
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        await fs.mkdir(uploadDir, { recursive: true })
        
        const fileName = `${Date.now()}-${image.name}`
        const filePath = path.join(uploadDir, fileName)
        
        await fs.writeFile(filePath, buffer)
        imageUrl = `/uploads/${fileName}`
        
        console.log("POST /api/items: Image saved successfully:", imageUrl)
      } catch (imageError) {
        console.error("POST /api/items: Error saving image:", imageError)
        return NextResponse.json(
          { error: "Failed to save image", details: String(imageError) },
          { status: 500 }
        )
      }
    }

    const newItem = createItem({
      name,
      location,
      description: description || "",
      imageUrl,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    })

    console.log("POST /api/items: Item created successfully:", newItem)
    return NextResponse.json(newItem, { status: 201 })
    
  } catch (error) {
    console.error("POST /api/items: Error creating item:", error)
    return NextResponse.json(
      { error: "Failed to create item", details: String(error) },
      { status: 500 }
    )
  }
}

