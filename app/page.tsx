import { Suspense } from "react"
import { Statistics } from "@/components/Statistics"
import { InventoryList } from "@/components/InventoryList"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Database, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function StatisticsLoading() {
  return <Skeleton className="w-full h-[200px]" />
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight animate-fade-in">
          Inventory Management
        </h1>
        <h2 className="text-2xl text-slate-300 animate-fade-in-delay">
          Streamline your inventory tracking and management
        </h2>
        <Button 
          asChild
          size="lg" 
          className="mt-8 animate-fade-in-delay-2"
        >
          <Link href="/dashboard">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  )
}