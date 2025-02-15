'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Backup {
  name: string
  size: number
  created: string
  path: string
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup')
      if (!response.ok) throw new Error('Failed to fetch backups')
      const data = await response.json()
      setBackups(data.backups)
    } catch (error) {
      toast.error('Failed to fetch backups')
      console.error(error)
    }
  }

  const createBackup = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Backups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={createBackup} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Backup...' : 'Create Backup'}
          </Button>

          <div className="space-y-2">
            {backups.map((backup) => (
              <div 
                key={backup.path}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="font-medium">{backup.name}</p>
                  <p className="text-sm text-gray-500">
                    Size: {(backup.size / 1024).toFixed(2)} KB • 
                    Created: {new Date(backup.created).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            
            {backups.length === 0 && (
              <p className="text-center text-gray-500">No backups available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}