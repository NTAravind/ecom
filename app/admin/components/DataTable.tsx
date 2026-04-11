"use client"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface DataTableProps<Tdata, TValue> {
  columns: ColumnDef<Tdata, TValue>[]
  data: Tdata[]
  brands?: { id: string, name: string }[]
  categories?: string[]
  colors?: string[]
}

export function DataTable<Tdata, TValue>({
  columns,
  data,
  brands = [],
  categories = [],
  colors = [],
}: DataTableProps<Tdata, TValue>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  const [pnameSearch, setPnameSearch] = useState(searchParams.get("pname") ?? "")

  useEffect(() => {
    setPnameSearch(searchParams.get("pname") ?? "")
  }, [searchParams])

  // Get unique values for filter dropdowns if not provided as props
  const uniqueBrands = brands.length > 0 ? brands : Array.from(
    new Map(data.map((item: any) => [item.brand?.id, { id: item.brand?.id, name: item.brand?.name }])).values()
  ).filter(b => b.id)
  
  const uniqueColors = colors.length > 0 ? colors : Array.from(
    new Set(data.map((item: any) => item.color).filter(Boolean))
  )
  const uniqueCategories = categories.length > 0 ? categories : Array.from(
    new Set(data.map((item: any) => item.category).filter(Boolean))
  )

  const updateParam = useCallback((key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value && value !== "" && value !== "all") {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    router.push(`${pathname}?${newParams.toString()}`)
  }, [searchParams, pathname, router])

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Filter by product name (Press Enter)..."
          value={pnameSearch}
          onChange={(event) => setPnameSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              updateParam("pname", pnameSearch)
            }
          }}
          className="w-full"
        />

        <Select
          value={searchParams.get("brandId") ?? ""}
          onValueChange={(value) => updateParam("brandId", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand: any) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("category") ?? ""}
          onValueChange={(value) => updateParam("category", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((category: any) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("color") ?? ""}
          onValueChange={(value) => updateParam("color", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {uniqueColors.map((color: any) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  {color}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("Shown") ?? ""}
          onValueChange={(value) => updateParam("Shown", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="true">Shown Only</SelectItem>
            <SelectItem value="false">Hidden Only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("isYarn") ?? ""}
          onValueChange={(value) => updateParam("isYarn", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="true">Yarn Only</SelectItem>
            <SelectItem value="false">Non-Yarn Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        <Button
          variant="outline"
          onClick={() => router.push(pathname)}
          className="w-full"
        >
          Clear Filters
        </Button>
      </div>

      {/* Stock and Price Range Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Min stock"
            type="number"
            value={searchParams.get("minStock") ?? ""}
            onChange={(event) => updateParam("minStock", event.target.value)}
            className="w-24"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            placeholder="Max stock"
            type="number"
            value={searchParams.get("maxStock") ?? ""}
            onChange={(event) => updateParam("maxStock", event.target.value)}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Min price"
            type="number"
            value={searchParams.get("minPrice") ?? ""}
            onChange={(event) => updateParam("minPrice", event.target.value)}
            className="w-24"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            placeholder="Max price"
            type="number"
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(event) => updateParam("maxPrice", event.target.value)}
            className="w-24"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full min-w-max">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3 text-left whitespace-nowrap">
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of{" "}
          {table.getCoreRowModel().rows.length} row(s) displayed.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}