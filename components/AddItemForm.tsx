'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateItemCode } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ItemData {
  name: string
  location: string
  description: string
  code: string
  price?: number
  imageUrl?: string
}

export default function AddItemForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<ItemData>({
    name: '',
    location: '',
    description: '',
    code: generateItemCode(),
    price: undefined,
    imageUrl: ''
  })

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image must be less than 5MB')
        return
      }
      
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }, [])

  const clearImage = useCallback(() => {
    setImageFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) throw new Error('Failed to upload image')
    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let finalImageUrl = formData.imageUrl

      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadResponse.ok) throw new Error('Failed to upload image')
        const { url } = await uploadResponse.json()
        finalImageUrl = url
      }

      // Create item with form data
      const itemFormData = new FormData()
      itemFormData.append('name', formData.name)
      itemFormData.append('location', formData.location)
      itemFormData.append('description', formData.description)
      itemFormData.append('code', formData.code)
      if (formData.price) itemFormData.append('price', formData.price.toString())
      if (finalImageUrl) itemFormData.append('imageUrl', finalImageUrl)

      const response = await fetch('/api/items', {
        method: 'POST',
        body: itemFormData
      })

      if (!response.ok) throw new Error('Failed to create item')
      
      toast.success('Item created successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('Failed to create item')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              required
              value={formData.location}
              onChange={e => setFormData(prev => ({
                ...prev,
                location: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={formData.code}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated unique code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={e => setFormData(prev => ({
                ...prev,
                price: e.target.value ? Number(e.target.value) : undefined
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="flex flex-col gap-4">
              {previewUrl && (
                <div className="relative w-full aspect-video">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {!previewUrl && (
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 5MB
                  </p>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById('image')?.click()}
                  >
                    Select Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}