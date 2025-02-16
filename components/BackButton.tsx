import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function BackButton() {
  return (
    <Button variant="ghost" asChild className="mb-4">
      <Link href="/dashboard">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
    </Button>
  )
}