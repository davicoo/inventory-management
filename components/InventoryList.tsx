'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Item {
  id: string
  name: string
  location: string
  description: string | null
  imageUrl: string | null
  sold: boolean
  paymentReceived: boolean
  code: string
  price: number
  created_at: string
}

export function InventoryList() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      const response = await fetch('/api/items')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      if (data.status === 'success') {
        setItems(data.data)
      }
    } catch (error) {
      toast.error('Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleSold(id: string) {
    setUpdating(id)
    try {
      const response = await fetch(`/api/items/${id}/sold`, {
        method: 'PUT'
      })
      if (!response.ok) throw new Error('Failed to update')
      
      setItems(items.map(item => 
        item.id === id ? { ...item, sold: !item.sold } : item
      ))
      router.refresh()
    } catch (error) {
      toast.error('Failed to update item')
    } finally {
      setUpdating(null)
    }
  }

  async function handleTogglePayment(id: string) {
    setUpdating(id)
    try {
      const response = await fetch(`/api/items/${id}/payment`, {
        method: 'PUT'
      })
      if (!response.ok) throw new Error('Failed to update')
      
      setItems(items.map(item => 
        item.id === id ? { ...item, paymentReceived: !item.paymentReceived } : item
      ))
      router.refresh()
    } catch (error) {
      toast.error('Failed to update payment status')
    } finally {
      setUpdating(null)
    }
  }

  if (isLoading) {
    return <LoadingItems />
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">No items found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                <p className="text-sm text-muted-foreground">Code: {item.code}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-medium">${item.price.toFixed(2)}</p>
                <div className="flex gap-2">
                  <Link href={`/items/${item.id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={item.sold ? "secondary" : "default"}
                    onClick={() => handleToggleSold(item.id)}
                    disabled={updating === item.id}
                  >
                    {item.sold ? 'Sold' : 'Mark Sold'}
                  </Button>
                  <Button
                    size="sm"
                    variant={item.paymentReceived ? "secondary" : "outline"}
                    onClick={() => handleTogglePayment(item.id)}
                    disabled={!item.sold || updating === item.id}
                  >
                    {item.paymentReceived ? 'Paid' : 'Mark Paid'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingItems() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
