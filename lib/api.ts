const API_BASE_URL = "/api"

export async function getItems() {
  try {
    console.log("Fetching items from API")
    const response = await fetch(`${API_BASE_URL}/items`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    const data = await response.json()
    console.log("Received data from API:", data)
    if (!Array.isArray(data)) {
      throw new Error(`Expected an array of items, but received: ${JSON.stringify(data)}`)
    }
    return data
  } catch (error) {
    console.error("Error in getItems:", error instanceof Error ? error.message : String(error))
    throw error
  }
}

export async function createItem(formData: FormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`Failed to create item. Status: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in createItem:", error)
    throw error
  }
}

export async function updateItem(id: string, updates: { sold?: boolean; paymentReceived?: boolean }) {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error(`Failed to update item. Status: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error("Error in updateItem:", error)
    throw error
  }
}

