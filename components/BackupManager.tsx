'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Backup {
  id: string
  filename: string
  size: number
  created_at: string
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetchBackups()
  }, [])

  async function fetchBackups() {
    try {
      const response = await fetch('/api/backups')
      if (!response.ok) throw new Error('Failed to fetch backups')
      const data = await response.json()
      if (data.status === 'success') {
        setBackups(data.data)
      }
    } catch (error) {
      toast.error('Failed to load backups')
    } finally {
      setIsLoading(false)
    }
  }

  async function createBackup() {
    setIsCreating(true)
    try {
      const response = await fetch('/api/backups', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to create backup')
      
      await fetchBackups()
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRestore(backupId: string) {
    if (!confirm('Are you sure? This will replace all current data.')) {
      return
    }

    setIsRestoring(backupId)
    try {
      const response = await fetch(`/api/backups/${backupId}/restore`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to restore backup')
      
      toast.success('Backup restored successfully')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to restore backup')
    } finally {
      setIsRestoring(null)
    }
  }

  if (isLoading) {
    return <div>Loading backups...</div>
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <Button 
            onClick={createBackup} 
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Backup'}
          </Button>

          <div className="space-y-2">
            {backups.map((backup) => (
              <div 
                key={backup.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="font-medium">{backup.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(backup.size / 1024).toFixed(2)} KB • 
                    Created: {new Date(backup.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRestore(backup.id)}
                    disabled={isRestoring === backup.id}
                    variant="outline"
                    size="sm"
                  >
                    {isRestoring === backup.id ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}