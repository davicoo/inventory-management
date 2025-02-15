import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import db, { saveImage } from "@/lib/db-config"

export async function GET() {
  try {
    console.log("Fetching items from database")
    const items = db.prepare("SELECT * FROM items").all()
    console.log(`Successfully fetched ${items.length} items`)
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const image = formData.get("image") as File | null

    let imageUrl = ""
    if (image) {
      imageUrl = await saveImage(image)
    }

    const id = uuidv4()
    const code = generateUniqueCode()

    const stmt = db.prepare(`
      INSERT INTO items (id, name, location, description, imageUrl, sold, paymentReceived, code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, name, location, description, imageUrl, false, false, code)

    return NextResponse.json(
      { id, name, location, description, imageUrl, sold: false, paymentReceived: false, code },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item", details: String(error) }, { status: 500 })
  }
}

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

