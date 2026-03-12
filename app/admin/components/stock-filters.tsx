"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useState, useEffect } from "react"

export function StockFilters({ brands }: { brands: { id: string, name: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      updateParam("search", searchTerm)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const updateParam = useCallback((key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value && value !== "" && value !== "all") {
      newParams.set(key, value)
      if (key !== 'page') newParams.set('page', '1') // Reset page on new filter
    } else {
      newParams.delete(key)
    }
    router.push(`${pathname}?${newParams.toString()}`)
  }, [searchParams, pathname, router])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Input
        placeholder="Search inventory..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />

      <Select
        value={searchParams.get("brandId") ?? "all"}
        onValueChange={(value) => updateParam("brandId", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(value) => updateParam("type", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Item Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="yarn">Yarn Only</SelectItem>
          <SelectItem value="non-yarn">Non-Yarn Products</SelectItem>
          <SelectItem value="accessory">Accessories</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          setSearchTerm("")
          router.push(pathname)
        }}
        className="w-full"
      >
        Clear Filters
      </Button>
    </div>
  )
}
