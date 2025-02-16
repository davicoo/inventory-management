import { Suspense } from "react"
import { Statistics } from "@/components/Statistics"
import { InventoryList } from "@/components/InventoryList"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Database } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function StatisticsLoading() {
  return <Skeleton className="w-full h-[200px]" />
}

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/backups">
              <Database className="mr-2 h-4 w-4" />
              Backups
            </Link>
          </Button>
        </div>
      </div>
      
      <Suspense fallback={<StatisticsLoading />}>
        <Statistics />
      </Suspense>

      <div className="mt-8">
        <InventoryList />
      </div>
    </main>
  )
}