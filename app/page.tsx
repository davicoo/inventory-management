import { Suspense } from "react"
import { Statistics } from "@/components/Statistics"
import { BackupManager } from "@/components/BackupManager"
import AddItemForm from "./components/AddItemForm"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryList } from "@/components/InventoryList"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
      <div className="mb-8">
        <Statistics />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <AddItemForm />
        <BackupManager />
      </div>
      <div className="mt-8">
        <InventoryList />
      </div>
    </main>
  )
}

