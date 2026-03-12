"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockItem, updateStock } from "../_actions/admin-stock"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Image from "next/image"

function EditableStockCell({ getValue, row: { index, original: item } }: any) {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpdate = async () => {
    setIsEditing(false)
    if (value === initialValue) return

    setIsUpdating(true)
    const res = await updateStock(item.id, item.type, value)
    setIsUpdating(false)
    
    if (res.success) {
      toast.success("Stock updated")
    } else {
      toast.error("Failed to update stock")
      setValue(initialValue) // Revert
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUpdate()
    if (e.key === "Escape") {
      setValue(initialValue)
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])
  
  // Keep syncing if the server response changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleUpdate}
        onKeyDown={handleKeyDown}
        className="w-20 h-8 text-center"
      />
    )
  }

  const isLowStock = value < 5

  return (
    <div 
      className={`cursor-pointer px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors inline-block min-w-16 text-center ${isLowStock ? 'font-bold text-red-600' : ''} ${isUpdating ? 'opacity-50' : ''}`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value}
    </div>
  )
}

const columns: ColumnDef<StockItem>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
        <Image src={row.original.image || "/placeholder.png"} alt={row.original.name} fill className="object-cover" />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium line-clamp-1">{row.original.name}</span>
        <span className="text-xs text-gray-500 capitalize">{row.original.type}</span>
      </div>
    )
  },
  {
    accessorKey: "brand.name",
    header: "Brand",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ getValue }) => {
      const color = getValue() as string
      return (
        <div className="flex items-center gap-2">
          {color !== "N/A" && (
            <div
              className="w-3 h-3 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="text-sm">{color}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "weight",
    header: "Weight / Dims",
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: EditableStockCell,
  },
]

export function StockTable({ data }: { data: StockItem[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border bg-white overflow-hidden flex flex-col h-full max-h-[70vh]">
      <div className="overflow-auto flex-1">
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap px-4 py-3 bg-gray-50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isLowStock = row.original.stock < 5
                return (
                  <TableRow
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50/50 hover:bg-red-50' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
