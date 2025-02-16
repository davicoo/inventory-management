import { NextResponse } from "next/server"
import { writeFile } from 'fs/promises'
import { join } from 'path'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename with timestamp
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const uniqueName = `${timestamp}-${Math.random().toString(36).substring(2)}.${ext}`
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadsDir, uniqueName)
    
    await writeFile(filePath, buffer)
    
    return NextResponse.json({ 
      url: `/uploads/${uniqueName}`
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}