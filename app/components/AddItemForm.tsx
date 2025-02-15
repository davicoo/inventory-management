"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createItem } from "@/lib/api"

export default function AddItemForm() {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !location) {
      toast({
        title: "Error",
        description: "Name and location are required.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("name", name)
    formData.append("location", location)
    formData.append("description", description)

    if (image) {
      if (image.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB.",
          variant: "destructive",
        })
        return
      }
      formData.append("image", image)
    }

    try {
      const newItem = await createItem(formData)
      toast({
        title: "Item added successfully",
        description: `New item added with code: ${newItem.code}`,
      })
      setName("")
      setLocation("")
      setDescription("")
      setImage(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Add New Item</h2>
      <div>
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="image">Image</Label>
        <Input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      </div>
      <Button type="submit">Add Item</Button>
    </form>
  )
}

