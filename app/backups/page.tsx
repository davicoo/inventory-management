import { BackupManager } from "@/components/BackupManager"
import { BackButton } from "@/components/BackButton"

export default function BackupsPage() {
  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Database Backups</h1>
      <BackupManager />
    </div>
  )
}