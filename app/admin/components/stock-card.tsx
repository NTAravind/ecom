"use client"

import { StockItem, updateStock } from "../_actions/admin-stock"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import { fcurrency } from "@/utils/utils"

export function StockCard({ item }: { item: StockItem }) {
  const [stock, setStock] = useState<number>(item.stock)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    if (stock === item.stock) return

    setIsUpdating(true)
    const res = await updateStock(item.id, item.type, stock)
    setIsUpdating(false)
    
    if (res.success) {
      toast.success("Stock updated")
    } else {
      toast.error("Failed to update stock")
      setStock(item.stock) // Revert on failure
    }
  }

  const isLowStock = item.stock < 5

  return (
    <div className={`flex flex-col p-4 border rounded-xl shadow-sm ${isLowStock ? "bg-red-50 border-red-200" : "bg-white"}`}>
      <div className="flex gap-4 mb-4">
        <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-md overflow-hidden">
          <Image
            src={item.image || "/placeholder.png"}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col flex-1">
          <h3 className={`font-semibold line-clamp-2 ${isLowStock ? "text-red-900" : "text-gray-900"}`}>
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Brand: <span className="font-medium text-gray-700">{item.brand.name}</span>
          </p>
          <div className="flex gap-2 text-xs text-gray-400 mt-1">
            <span>{item.category}</span>
            <span>•</span>
            <span className="capitalize">{item.type}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-3 pt-3 border-t">
        <div className="flex flex-col flex-1">
          <label className={`text-xs font-semibold mb-1 ${isLowStock ? "text-red-600" : "text-gray-500"}`}>
            Stock Quantity{isLowStock && " (LOW)"}
          </label>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="h-12 text-lg text-center"
          />
        </div>
        <Button 
          onClick={handleUpdate} 
          disabled={isUpdating || stock === item.stock}
          className="h-12 px-6"
        >
          {isUpdating ? "Saving..." : "Update"}
        </Button>
      </div>
    </div>
  )
}
