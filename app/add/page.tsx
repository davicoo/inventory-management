import AddItemForm from "@/components/AddItemForm"
import { BackButton } from "@/components/BackButton"

export default function AddItemPage() {
  return (
    <div className="container mx-auto p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>
      <AddItemForm />
    </div>
  )
}