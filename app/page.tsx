import { Suspense } from "react"
import { Statistics } from "@/components/Statistics"
import { BackupManager } from "@/components/BackupManager"
import AddItemForm from "./components/AddItemForm"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryList } from "@/components/InventoryList"

function StatisticsLoading() {
  return <Skeleton className="w-full h-[200px]" />
}

function BackupLoading() {
  return <Skeleton className="w-full h-[300px]" />
}

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
      
      <Suspense fallback={<StatisticsLoading />}>
        <div className="mb-8">
          <Statistics />
        </div>
      </Suspense>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
          <AddItemForm />
        </div>
        
        <Suspense fallback={<BackupLoading />}>
          <div>
            <h2 className="text-xl font-semibold mb-4">Database Backups</h2>
            <BackupManager />
          </div>
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Inventory List</h2>
          <InventoryList />
        </div>
      </Suspense>
    </main>
  )
}