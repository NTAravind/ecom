import Header from "@/app/components/Header"
import { getStockItems } from "../_actions/admin-stock"
import prisma from "@/lib/prisma"
import { StockFilters } from "../components/stock-filters"
import { StockTable } from "../components/stock-table"
import { StockCard } from "../components/stock-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type SearchParams = Promise<{ [key: string]: string | undefined }>

export default async function AdminStockPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  
  // Await the data fetching
  const [stockResponse, brands] = await Promise.all([
    getStockItems(searchParams),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
  ])

  const { items, totalPages, currentPage, totalItems } = stockResponse
  
  // Previous/Next page URLs parameters mapping
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams()
    if (searchParams.brandId) params.set("brandId", searchParams.brandId)
    if (searchParams.type) params.set("type", searchParams.type)
    if (searchParams.search) params.set("search", searchParams.search)
    params.set("page", pageNumber.toString())
    return `/admin/stock?${params.toString()}`
  }

  return (
    <div className="mx-5 lg:mx-5 my-3 flex flex-col h-[calc(100vh-theme(spacing.24))]">
      <div className="flex justify-between gap-4 items-center mb-6">
        <Header>Stock Management</Header>
        <span className="text-sm text-gray-500 hidden md:inline-block">
          {totalItems} total items
        </span>
      </div>

      <StockFilters brands={brands} />

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 min-h-0 overflow-hidden">
        <StockTable data={items} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4 overflow-y-auto pb-6">
        {items.length > 0 ? (
          items.map((item) => (
            <StockCard key={`${item.type}-${item.id}`} item={item} />
          ))
        ) : (
          <div className="py-12 text-center text-gray-500 border rounded-xl bg-gray-50">
            No inventory items found.
          </div>
        )}
      </div>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between shrink-0 bg-white pt-2">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={createPageUrl(currentPage - 1)}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={createPageUrl(currentPage + 1)}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
