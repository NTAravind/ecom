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
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface DataTableProps<Tdata, TValue> {
  columns: ColumnDef<Tdata, TValue>[]
  data: Tdata[]
}

export function OrdersDataTable<Tdata, TValue>({
  columns,
  data,
}: DataTableProps<Tdata, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
  const router = useRouter()

  // Set default filter to show only paid orders
  useEffect(() => {
    if (!hasAppliedFilters) {
      setColumnFilters([{ id: "paid", value: true }])
    }
  }, [hasAppliedFilters])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      setHasAppliedFilters(true)
    },
    state: {
      sorting,
      columnFilters,
    },
  })

  // Get unique values for filter dropdowns
  const uniqueCustomers = Array.from(
    new Set(data.map((item: any) => item.user?.name).filter(Boolean))
  )
  const uniquePaymentStatuses = ["paid", "unpaid"]
  const uniqueOrderStatuses = ["complete", "incomplete"]

  // Custom clear filters function to reset to default state
  const clearFilters = () => {
    setColumnFilters([{ id: "paid", value: true }])
    setHasAppliedFilters(false)
  }

  // Get current payment filter value for the select component
  const currentPaymentFilter = table.getColumn("paid")?.getFilterValue()
  let paymentSelectValue = "paid" // default
  if (currentPaymentFilter === "") {
    paymentSelectValue = "all"
  } else if (currentPaymentFilter === false) {
    paymentSelectValue = "unpaid"
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Filter by Order ID..."
          value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Input
          placeholder="Filter by customer name..."
          value={(table.getColumn("user_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("user_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Input
          placeholder="Filter by Payment ID..."
          value={(table.getColumn("paymentid")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("paymentid")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Select
          value={paymentSelectValue}
          onValueChange={(value) => {
            if (value === "all") {
              table.getColumn("paid")?.setFilterValue("")
            } else if (value === "paid") {
              table.getColumn("paid")?.setFilterValue(true)
            } else {
              table.getColumn("paid")?.setFilterValue(false)
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("complete")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("complete")?.setFilterValue(value === "all" ? "" : value === "complete")
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range filter inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            placeholder="From date"
            onChange={(event) => {
              const fromDate = event.target.value
              const toDate = table.getColumn("createdAt")?.getFilterValue() as [string, string] || ["", ""]
              table.getColumn("createdAt")?.setFilterValue([fromDate, toDate[1]])
            }}
            className="w-[150px]"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            placeholder="To date"
            onChange={(event) => {
              const toDate = event.target.value
              const fromDate = table.getColumn("createdAt")?.getFilterValue() as [string, string] || ["", ""]
              table.getColumn("createdAt")?.setFilterValue([fromDate[0], toDate])
            }}
            className="w-[150px]"
          />
        </div>

        {/* Clear filters button */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="h-8"
        >
          Clear Filters
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/orders/${(row.original as any).id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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

      {/* Pagination and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of{" "}
          {table.getCoreRowModel().rows.length} order(s) displayed.
          {!hasAppliedFilters && (
            <span className="ml-2 text-xs text-blue-600">
              (Showing only paid orders by default)
            </span>
          )}
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
          <div className="flex items-center gap-1 text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
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