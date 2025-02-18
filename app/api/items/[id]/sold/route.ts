import { NextResponse } from "next/server"
import { statements } from "@/lib/db-config"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const item = statements.updateSold.get(!item?.sold ? 1 : 0, id)
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      status: 'success',
      data: {
        ...item,
        sold: Boolean(item.sold),
        paymentReceived: Boolean(item.paymentReceived)
      }
    })
  } catch (error) {
    console.error('Error updating sold status:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}