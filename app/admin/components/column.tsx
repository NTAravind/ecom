"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { fcurrency } from "@/utils/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { deleteproduct, ToggleAvailability } from "../_actions/products"
import { Available, DelButton } from "../products/_components/ProductButton"
import { useRouter } from "next/navigation"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type products = {
  id: string,
  pname: string,
  brand: string,
  price: number,
  category: string,
  stock: number,
  Shown: boolean,
  color: string,
  y_weight: string,
}

export const columns: ColumnDef<products>[] = [
  {
    accessorKey: "brand",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Brand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => (
      fcurrency(Number(getValue()))
    )
  },
  {
    accessorKey: "pname",
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
  },
  {
    accessorKey:"y_weight",
    header: "Yarn Weight",
  },
  {
    accessorKey: "Shown",
    header: "IsShown",
    cell: ({ getValue }) => (
      getValue()
        ? <span className="text-green-600 font-semibold">Yes</span>
        : <span className="text-red-600 font-semibold">No</span>
    )
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ getValue }) => {
      const color = getValue() as string
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm">{color}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
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
            <Available id={product.id} isavail={product.Shown} />
            <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.id}`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DelButton id={product.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
]