import React, { useState } from 'react';
import InventoryItem from './InventoryItem';

export function InventoryList() {
  const [items, setItems] = useState([])

  const handleDelete = (deletedId: string) => {
    setItems(items.filter(item => item.id !== deletedId))
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <InventoryItem 
          key={item.id} 
          item={item} 
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
