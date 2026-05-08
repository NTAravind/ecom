"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export type StockItem = {
  id: string
  type: "product" | "accessory"
  name: string
  brand: { id: string; name: string }
  category: string
  color: string
  weight: string
  stock: number
  image: string
}

export type StockResponse = {
  items: StockItem[]
  totalPages: number
  currentPage: number
  totalItems: number
}

const ITEMS_PER_PAGE = 50

export async function getStockItems(searchParams: {
  brandId?: string
  type?: string
  search?: string
  page?: string
}): Promise<StockResponse> {
  const page = Number(searchParams.page) || 1
  const skip = (page - 1) * ITEMS_PER_PAGE
  
  const typeFilter = searchParams.type || "all"
  const searchFilter = searchParams.search ? searchParams.search.toLowerCase() : ""
  
  let productsPromise: Promise<any[]> = Promise.resolve([])
  let accessoriesPromise: Promise<any[]> = Promise.resolve([])
  
  // Build Product query if applicable
  if (typeFilter === "all" || typeFilter === "yarn" || typeFilter === "non-yarn") {
    const where: any = {}
    
    // Apply specific type filter if requested
    if (typeFilter === "yarn") where.isYarn = true
    if (typeFilter === "non-yarn") where.isYarn = false

    if (searchParams.brandId && searchParams.brandId !== "all") {
      where.brandId = searchParams.brandId
    }
    
    if (searchFilter) {
      where.pname = { contains: searchFilter, mode: "insensitive" }
    }

    productsPromise = prisma.product.findMany({
      where,
      include: { brand: { select: { id: true, name: true } } },
      orderBy: { pname: 'asc' }
    })
  }

  // Build YarnAccessory query if applicable
  // Accessories do not have a brandId. Only query them if no specific brand is selected.
  if ((typeFilter === "all" || typeFilter === "accessory") && (!searchParams.brandId || searchParams.brandId === "all")) {
    const where: any = {}
    
    if (searchFilter) {
      where.name = { contains: searchFilter, mode: "insensitive" }
    }

    accessoriesPromise = prisma.yarnAccessory.findMany({
      where,
      orderBy: { name: 'asc' }
    })
  }

  // Fetch all matching data (we'll paginate in memory since we merge two tables)
  const [rawProducts, rawAccessories] = await Promise.all([productsPromise, accessoriesPromise])

  const allItems: StockItem[] = []

  // Map products
  rawProducts.forEach(p => {
    allItems.push({
      id: p.id,
      type: "product",
      name: p.pname,
      brand: p.brand,
      category: p.category,
      color: p.color,
      weight: p.y_weight ? `${p.y_weight} (${p.weight_g}g)` : `${p.weight_g}g`,
      stock: p.stock,
      image: p.irul
    })
  })

  // Map accessories
  rawAccessories.forEach(a => {
    allItems.push({
      id: a.id,
      type: "accessory",
      name: a.name,
      brand: { id: "none", name: "No Brand" }, // Accessories have no brand relation
      category: a.category,
      color: "N/A", // Not stored in DB
      weight: "N/A", 
      stock: a.stock,
      image: a.imageUrl
    })
  })

  // Sort merged results by name
  allItems.sort((a, b) => a.name.localeCompare(b.name))

  // Manual pagination
  const totalItems = allItems.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedItems = allItems.slice(skip, skip + ITEMS_PER_PAGE)

  return {
    items: paginatedItems,
    totalPages,
    currentPage: page,
    totalItems
  }
}

export async function updateStock(id: string, type: "product" | "accessory", stock: number) {
  try {
    if (type === "product") {
      await prisma.product.update({
        where: { id },
        data: { stock }
      })
    } else if (type === "accessory") {
      await prisma.yarnAccessory.update({
        where: { id },
        data: { stock }
      })
    }
    
    revalidatePath("/admin/stock")
    return { success: true }
  } catch (error) {
    console.error("Failed to update stock:", error)
    return { success: false, error: "Failed to update stock" }
  }
}
