"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { fcurrency } from "@/utils/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { deleteproduct, ToggleAvailability } from "../_actions/products"
import { Available, DelButton } from "../products/_components/ProductButton"
import { useRouter } from "next/navigation"

// Updated type to match your Prisma schema
export type ProductWithBrand = {
  id: string,
  pname: string,
  brandId: string,
  brand: {
    id: string,
    name: string,
    discountRate: number,
    isActive: boolean
  },
  originalPrice: number,
  discountedPrice: number,
  category: string,
  stock: number,
  Shown: boolean,
  color: string,
  y_weight: string,
  weight_g: number,
  isYarn: boolean,
}

export const columns: ColumnDef<ProductWithBrand>[] = [
  {
    id: "brand-name",
    accessorFn: (row) => row.brand?.name || "",
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
      fcurrency(Number(getValue()))
    )
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
    cell: ({ getValue, row }) => {
      const discountedPrice = Number(getValue())
      const originalPrice = row.original.originalPrice
      const hasDiscount = discountedPrice < originalPrice
      
      return (
        <div className="flex flex-col">
          <span className={hasDiscount ? "text-green-600 font-semibold" : ""}>
            {fcurrency(discountedPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              {fcurrency(originalPrice)}
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const price = row.getValue(id) as number
      const [min, max] = value as [number, number]
      if (min !== undefined && price < min) return false
      if (max !== undefined && price > max) return false
      return true
    }
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
    cell: ({ getValue }) => {
      const stock = Number(getValue())
      return (
        <span className={stock < 10 ? "text-red-600 font-semibold" : ""}>
          {stock}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      const stockValue = row.getValue(id) as number
      const [min, max] = value as [number, number]
      if (min !== undefined && stockValue < min) return false
      if (max !== undefined && stockValue > max) return false
      return true
    }
  },
  {
    accessorKey: "y_weight",
    header: "Yarn Weight",
  },
  {
    accessorKey: "weight_g",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Weight (g)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => `${getValue()}g`
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "isYarn",
    header: "Is Yarn",
    cell: ({ getValue }) => (
      getValue()
        ? <span className="text-blue-600 font-semibold">Yes</span>
        : <span className="text-gray-600 font-semibold">No</span>
    )
  },
  {
    accessorKey: "Shown",
    header: "Is Shown",
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
    id: "brand-discount",
    header: "Brand Discount",
    cell: ({ row }) => {
      const discountRate = row.original.brand.discountRate
      const isActive = row.original.brand.isActive
      
      return (
        <div className="flex items-center gap-2">
          <span className={discountRate > 0 ? "text-green-600 font-semibold" : "text-gray-500"}>
            {discountRate}%
          </span>
          {!isActive && (
            <span className="text-xs text-red-500">(Inactive)</span>
          )}
        </div>
      )
    }
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
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/brands/${product.brand.id}`)}>
              Edit Brand
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DelButton id={product.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
]