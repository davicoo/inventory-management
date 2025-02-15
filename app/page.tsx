import { Suspense } from "react"
import InventoryList from "./components/InventoryList"
import AddItemForm from "./components/AddItemForm"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AddItemForm />
        <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
          <InventoryList />
        </Suspense>
      </div>
    </main>
  )
}

