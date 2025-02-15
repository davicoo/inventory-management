'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

interface InventoryItemProps {
  item: {
    id: string
    name: string
    location: string
    description: string
    code: string
    sold: boolean
    paymentReceived: boolean
    imageUrl?: string
  }
  onUpdate: (id: string, updates: { sold?: boolean; paymentReceived?: boolean }) => void
  onDelete: (id: string) => void
}

export function InventoryItem({ item, onUpdate, onDelete }: InventoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/items?id=${item.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete item')
      }

      onDelete(item.id)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border p-4 rounded-lg shadow">
      {item.imageUrl && (
        <div className="relative w-full h-48 mb-4">
          <Image
            src={item.imageUrl}
            alt={`Image of ${item.name}`}
            fill
            className="object-cover rounded-md"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
      <p className="text-sm text-gray-500 mb-2">Code: {item.code}</p>
      <p>Location: {item.location}</p>
      <p>Description: {item.description}</p>
      
      <div className="flex flex-col gap-2 mt-4">
        <Button
          onClick={() => onUpdate(item.id, { sold: !item.sold })}
          variant={item.sold ? "secondary" : "default"}
        >
          {item.sold ? "Mark as Unsold" : "Mark as Sold"}
        </Button>
        
        <Button
          onClick={() => onUpdate(item.id, { paymentReceived: !item.paymentReceived })}
          variant={item.paymentReceived ? "secondary" : "default"}
        >
          {item.paymentReceived ? "Mark as Unpaid" : "Mark as Paid"}
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Item"}
        </Button>
      </div>
    </div>
  )
}
