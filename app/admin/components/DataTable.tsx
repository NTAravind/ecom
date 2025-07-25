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
import { useState } from "react"

interface DataTableProps<Tdata, TValue> {
  columns: ColumnDef<Tdata, TValue>[]
  data: Tdata[]
}

export function DataTable<Tdata, TValue>({
  columns,
  data,
}: DataTableProps<Tdata, TValue>) {
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

  // Get unique values for filter dropdowns - updated for new schema
  const uniqueBrands = Array.from(
    new Set(data.map((item: any) => item.brand?.name).filter(Boolean))
  )
  const uniqueColors = Array.from(
    new Set(data.map((item: any) => item.color).filter(Boolean))
  )
  const uniqueCategories = Array.from(
    new Set(data.map((item: any) => item.category).filter(Boolean))
  )

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Filter by product name..."
          value={(table.getColumn("pname")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("pname")?.setFilterValue(event.target.value)
          }
          className="w-full"
        />

        <Select
          value={(table.getColumn("brand-name")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("brand-name")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("category")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("category")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("color")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("color")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {uniqueColors.map((color) => (
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
          value={(table.getColumn("Shown")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("Shown")?.setFilterValue(value === "all" ? "" : value === "true")
          }
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
          value={(table.getColumn("isYarn")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("isYarn")?.setFilterValue(value === "all" ? "" : value === "true")
          }
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
          onClick={() => table.resetColumnFilters()}
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
            value={(table.getColumn("stock")?.getFilterValue() as [number, number])?.[0] ?? ""}
            onChange={(event) => {
              const value = event.target.value
              const currentFilter = table.getColumn("stock")?.getFilterValue() as [number, number] | undefined
              table.getColumn("stock")?.setFilterValue([
                value ? Number(value) : undefined,
                currentFilter?.[1]
              ])
            }}
            className="w-24"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            placeholder="Max stock"
            type="number"
            value={(table.getColumn("stock")?.getFilterValue() as [number, number])?.[1] ?? ""}
            onChange={(event) => {
              const value = event.target.value
              const currentFilter = table.getColumn("stock")?.getFilterValue() as [number, number] | undefined
              table.getColumn("stock")?.setFilterValue([
                currentFilter?.[0],
                value ? Number(value) : undefined
              ])
            }}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Min price"
            type="number"
            value={(table.getColumn("discountedPrice")?.getFilterValue() as [number, number])?.[0] ?? ""}
            onChange={(event) => {
              const value = event.target.value
              const currentFilter = table.getColumn("discountedPrice")?.getFilterValue() as [number, number] | undefined
              table.getColumn("discountedPrice")?.setFilterValue([
                value ? Number(value) : undefined,
                currentFilter?.[1]
              ])
            }}
            className="w-24"
          />
          <span className="text-sm text-gray-500">to</span>
          <Input
            placeholder="Max price"
            type="number"
            value={(table.getColumn("discountedPrice")?.getFilterValue() as [number, number])?.[1] ?? ""}
            onChange={(event) => {
              const value = event.target.value
              const currentFilter = table.getColumn("discountedPrice")?.getFilterValue() as [number, number] | undefined
              table.getColumn("discountedPrice")?.setFilterValue([
                currentFilter?.[0],
                value ? Number(value) : undefined
              ])
            }}
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