"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Item {
  id: string
  name: string
  location: string
  description: string
  imageUrl: string
  sold: boolean
  paymentReceived: boolean
  code: string
}

export default function InventoryList() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/items")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error("Received data is not an array")
      }
      setItems(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching items:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateItemStatus = async (id: string, field: "sold" | "paymentReceived") => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: true }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      await fetchItems()
    } catch (error) {
      console.error(`Error updating ${field} status:`, error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (items.length === 0) return <div>No items found. Add some items to get started!</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Inventory List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <Badge>{item.code}</Badge>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Location:</strong> {item.location}
              </p>
              <p>
                <strong>Description:</strong> {item.description}
              </p>
              {item.imageUrl && (
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="mt-2 rounded-md"
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => handleUpdateItemStatus(item.id, "sold")} disabled={item.sold}>
                {item.sold ? "Sold" : "Mark as Sold"}
              </Button>
              <Button
                onClick={() => handleUpdateItemStatus(item.id, "paymentReceived")}
                disabled={item.paymentReceived}
              >
                {item.paymentReceived ? "Paid" : "Mark as Paid"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

