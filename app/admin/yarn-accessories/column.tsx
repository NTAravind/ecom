"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { fcurrency } from "@/utils/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Check, X, Loader2 } from "lucide-react"
import { deleteYarnAccessory, toggleYarnAccessoryAvailability, updateYarnAccessoryStock, updateYarnAccessoryDiscount } from "../_actions/yarn-accessories"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export type YarnAccessoryWithId = {
  id: string,
  name: string,
  originalPrice: number,
  discountedPrice: number,
  stock: number,
  imageUrl: string,
  description: string,
  category: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}

function StockCell({ 
  initialStock, 
  id,
  onUpdate 
}: { 
  initialStock: number
  id: string
  onUpdate: () => void
}) {
  const [stock, setStock] = useState(initialStock)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tempValue, setTempValue] = useState(initialStock.toString())

  useEffect(() => {
    setStock(initialStock)
    setTempValue(initialStock.toString())
  }, [initialStock])

  const handleSave = async () => {
    const newStock = parseInt(tempValue)
    if (isNaN(newStock) || newStock < 0) return
    
    setIsSaving(true)
    const result = await updateYarnAccessoryStock(id, newStock)
    setIsSaving(false)
    
    if (result.success) {
      setStock(newStock)
      setIsEditing(false)
      onUpdate()
    }
  }

  const handleCancel = () => {
    setTempValue(stock.toString())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="h-8 w-20"
          min="0"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel} disabled={isSaving}>
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-gray-100 p-1 rounded inline-flex items-center"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      <span className={stock < 10 ? "text-red-600 font-semibold" : ""}>
        {stock}
      </span>
    </div>
  )
}

function DiscountCell({ 
  initialPrice, 
  discountedPrice: initialDiscountedPrice,
  id,
  onUpdate 
}: { 
  initialPrice: number
  discountedPrice: number
  id: string
  onUpdate: () => void
}) {
  const [discountedPrice, setDiscountedPrice] = useState(initialDiscountedPrice)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tempValue, setTempValue] = useState(initialDiscountedPrice.toString())

  useEffect(() => {
    setDiscountedPrice(initialDiscountedPrice)
    setTempValue(initialDiscountedPrice.toString())
  }, [initialDiscountedPrice])

  const handleSave = async () => {
    const newPrice = parseInt(tempValue)
    if (isNaN(newPrice) || newPrice < 1) return
    
    setIsSaving(true)
    const result = await updateYarnAccessoryDiscount(id, newPrice)
    setIsSaving(false)
    
    if (result.success) {
      setDiscountedPrice(newPrice)
      setIsEditing(false)
      onUpdate()
    }
  }

  const handleCancel = () => {
    setTempValue(discountedPrice.toString())
    setIsEditing(false)
  }

  const hasDiscount = discountedPrice < initialPrice
  const discountPercent = hasDiscount ? Math.round(((initialPrice - discountedPrice) / initialPrice) * 100) : 0

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="h-8 w-24"
          min="1"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel} disabled={isSaving}>
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      <div className="flex flex-col">
        <span className={hasDiscount ? "text-green-600 font-semibold" : ""}>
          {fcurrency(discountedPrice)}
        </span>
        {hasDiscount && (
          <span className="text-xs text-gray-500 line-through">
            {fcurrency(initialPrice)} (-{discountPercent}%)
          </span>
        )}
      </div>
    </div>
  )
}

export const columns: ColumnDef<YarnAccessoryWithId>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "originalPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Original Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => (
      <span className="text-gray-500 line-through">
        {fcurrency(Number(getValue()))}
      </span>
    ),
  },
  {
    accessorKey: "discountedPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Discounted Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row, getValue }) => {
      const originalPrice = row.original.originalPrice
      const discountedPrice = Number(getValue())
      
      return (
        <DiscountCell 
          initialPrice={originalPrice}
          discountedPrice={discountedPrice}
          id={row.original.id}
          onUpdate={() => {}}
        />
      )
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row, getValue }) => {
      return (
        <StockCell 
          initialStock={Number(getValue())}
          id={row.original.id}
          onUpdate={() => {}}
        />
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => (
      getValue()
        ? <span className="text-green-600 font-semibold">Active</span>
        : <span className="text-red-600 font-semibold">Inactive</span>
    )
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => {
      const date = getValue() as Date
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const accessory = row.original
      const router = useRouter()
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => toggleYarnAccessoryAvailability(accessory.id, accessory.isActive)}>
              {accessory.isActive ? "Hide from website" : "Show on website"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/yarn-accessories/${accessory.id}`)}>
              Edit Accessory
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                if (confirm("Are you sure you want to delete this accessory?")) {
                  deleteYarnAccessory(accessory.id).catch(err => alert(err.message))
                }
              }}
              className="text-red-600"
            >
              Delete Accessory
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
]
