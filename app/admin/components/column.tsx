
"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { fcurrency } from "@/utils/utils"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
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
    header: "brand",
  },
  {
    accessorKey: "price",
    header: "price",
    cell: ({ getValue }) => (
      fcurrency(Number(getValue()))
    )
  },
  {
    accessorKey: "pname",
    header: "Name",
  },
  {
    accessorKey: "stock",
    header: "stock",
  },
  {
    accessorKey:"y_weight",
    header:"Yarn Weight",
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
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Available id={product.id} isavail={product.Shown} />
            <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.id}`)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator></DropdownMenuSeparator>
            <DelButton id={product.id} />
          </DropdownMenuContent>

        </DropdownMenu>
      )
    }
  }
]


