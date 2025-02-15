'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"

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
    price?: number
  }
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

export function InventoryItem({ item, onUpdate, onDelete }: InventoryItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedItem, setEditedItem] = useState(item)

  const handleEdit = async () => {
    if (isEditing) {
      setIsUpdating(true)
      try {
        const updates = {
          name: editedItem.name,
          location: editedItem.location,
          description: editedItem.description,
          price: editedItem.price ? Number(editedItem.price) : undefined
        }

        console.log('Sending update:', updates)

        const response = await fetch(`/api/items/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || 'Failed to update item')
        }

        const updatedItem = await response.json()
        onUpdate(item.id, updatedItem)
        toast.success('Item updated successfully')
        setIsEditing(false)
      } catch (error) {
        console.error('Error updating item:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update item')
      } finally {
        setIsUpdating(false)
      }
    } else {
      setIsEditing(true)
    }
  }

  const handleUpdate = async (updates: { sold?: boolean; paymentReceived?: boolean }) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      const updatedItem = await response.json()
      onUpdate(item.id, updates)
      toast.success('Item updated successfully')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setIsUpdating(false)
    }
  }

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
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name:</label>
            <Input
              value={editedItem.name}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location:</label>
            <Input
              value={editedItem.location}
              onChange={(e) => setEditedItem({ ...editedItem, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description:</label>
            <Textarea
              value={editedItem.description}
              onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price:</label>
            <Input
              type="number"
              value={editedItem.price || ''}
              onChange={(e) => setEditedItem({ ...editedItem, price: parseFloat(e.target.value) })}
              step="0.01"
            />
          </div>
        </div>
      ) : (
        <>
          <h3 className="font-bold text-lg mb-2">{item.name}</h3>
          <p className="text-sm text-gray-500 mb-2">Code: {item.code}</p>
          <p>Location: {item.location}</p>
          <p>Description: {item.description}</p>
          {item.price && <p className="font-medium mt-2">Price: ${item.price.toFixed(2)}</p>}
        </>
      )}
      
      <div className="flex flex-col gap-2 mt-4">
        <Button
          onClick={handleEdit}
          variant="outline"
          disabled={isUpdating}
        >
          {isEditing 
            ? (isUpdating ? "Saving..." : "Save Changes")
            : "Edit Item"}
        </Button>
        
        {!isEditing && (
          <>
            <Button
              onClick={() => handleUpdate({ sold: !item.sold })}
              variant={item.sold ? "secondary" : "default"}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : item.sold ? "Mark as Unsold" : "Mark as Sold"}
            </Button>
            
            <Button
              onClick={() => handleUpdate({ paymentReceived: !item.paymentReceived })}
              variant={item.paymentReceived ? "secondary" : "default"}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : item.paymentReceived ? "Mark as Unpaid" : "Mark as Paid"}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
