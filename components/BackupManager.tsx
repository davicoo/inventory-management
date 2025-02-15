'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loading } from "@/components/ui/loading"
import { Trash2 } from "lucide-react"

interface Backup {
  name: string
  size: number
  created: string
  path: string
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup')
      if (!response.ok) throw new Error('Failed to fetch backups')
      const data = await response.json()
      setBackups(data.backups)
    } catch (error) {
      toast.error('Failed to fetch backups')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const createBackup = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/backup', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        toast.success('Backup created successfully')
        fetchBackups()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error('Failed to create backup')
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Backups</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading variant="card" height={200} count={3} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Backups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={createBackup} 
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loading variant="inline" height={16} />
                <span className="ml-2">Creating Backup...</span>
              </>
            ) : (
              'Create Backup'
            )}
          </Button>

          <div className="space-y-2">
            {backups.map((backup) => (
              <div 
                key={backup.path}
                className="flex items-center justify-between p-2 border rounded hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{backup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(backup.size / 1024).toFixed(2)} KB • 
                    Created: {new Date(backup.created).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            
            {backups.length === 0 && (
              <p className="text-center text-muted-foreground">
                No backups available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}