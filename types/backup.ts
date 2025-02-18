export interface BackupInfo {
  name: string
  size: number
  created: string
  path: string
}

export interface BackupResult {
  success: boolean
  path?: string
  size?: number
  timestamp?: string
  validated?: boolean
  error?: string
}