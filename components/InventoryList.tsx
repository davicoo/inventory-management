'use client'

import { useState, useEffect } from "react"
import { InventoryItem } from "./InventoryItem"
import { toast } from "sonner"

export function InventoryList() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()

    // Listen for the custom event
    window.addEventListener('itemAdded', fetchItems)

    // Cleanup
    return () => {
      window.removeEventListener('itemAdded', fetchItems)
    }
  }, [])

  const handleUpdate = async (id: string, updates: { sold?: boolean; paymentReceived?: boolean }) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        setItems(items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ))
        toast.success('Item updated successfully')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Optimistically update UI
      setItems(items.filter(item => item.id !== id))
      toast.success('Item deleted successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      // Rollback on error
      await fetchItems()
      toast.error('Failed to delete item')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center">Loading items...</div>
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <div className="col-span-full text-center text-gray-500">
          No items found. Add some items to get started!
        </div>
      ) : (
        items.map((item) => (
          <InventoryItem 
            key={item.id}
            item={item}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  )
}
