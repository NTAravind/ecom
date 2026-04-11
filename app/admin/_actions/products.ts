"use server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import z from "zod"
import { revalidatePath } from "next/cache"

// Updated schema - removed url2, desc, category, weight, gweight since they come from Brand
const formdat = z.object({
  name: z.string().min(1, "Product name is required"),
  brandId: z.string().min(1, "Brand selection is required"),
  url: z.string().min(1, "Product image URL is required"),
  originalPrice: z.coerce.number().int().min(1, "Original price must be at least 1"),
  discountedPrice: z.coerce.number().int().min(1, "Discounted price must be at least 1"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  color: z.string().min(1, "Color is required"),
  shown: z.string().transform((val) => val === "true"), // Convert string to boolean
})

export async function addProduct(prevState: unknown, formdata: FormData) {
  const res = formdat.safeParse(Object.fromEntries(formdata.entries()))
  
  if (res.success === false) {
    return { message: res.error.errors[0]?.message || "Validation failed" }
  }

  const data = res.data

  try {
    // Get brand details to inherit properties
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId }
    })

    if (!brand) {
      return { message: "Selected brand not found" }
    }

    // Create product with inherited brand properties
    await prisma.product.create({
      data: {
        pname: data.name,
        brandId: data.brandId,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        irul: data.url,
        stock: data.stock,
        color: data.color,
        Shown: data.shown,
        isYarn: true,
        // Inherited from brand
        desc: brand.desc,
        category: brand.category,
        y_weight: brand.y_weight,
        weight_g: brand.weight_g,
      }
    })

    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
    
    return { message: "" } // Empty message indicates success
  } catch (error) {
    console.error("Error adding product:", error)
    return { message: "Failed to add product. Please try again." }
  }
}

export async function updateproduct(id: string, prevState: unknown, formdata: FormData) {
  const res = formdat.safeParse(Object.fromEntries(formdata.entries()))
  
  if (res.success === false) {
    return { message: res.error.errors[0]?.message || "Validation failed" }
  }

  const data = res.data

  try {
    // Get brand details to inherit properties
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId }
    })

    if (!brand) {
      return { message: "Selected brand not found" }
    }

    // Update product with inherited brand properties
    await prisma.product.update({
      where: { id },
      data: {
        pname: data.name,
        brandId: data.brandId,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        irul: data.url,
        stock: data.stock,
        color: data.color,
        Shown: data.shown,
        // Update inherited properties from brand
        desc: brand.desc,
        category: brand.category,
        y_weight: brand.y_weight,
        weight_g: brand.weight_g,
      }
    })

    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
    
    return { message: "" } // Empty message indicates success
  } catch (error) {
    console.error("Error updating product:", error)
    return { message: "Failed to update product. Please try again." }
  }
}

export async function ProductsTable(searchParams?: { [key: string]: string | string[] | undefined }) {
  const where: any = {};
  
  if (searchParams) {
    if (searchParams.pname) {
      where.pname = { contains: searchParams.pname as string, mode: 'insensitive' };
    }
    if (searchParams.brandId && searchParams.brandId !== 'all') {
      where.brandId = searchParams.brandId as string;
    }
    if (searchParams.category && searchParams.category !== 'all') {
      where.category = searchParams.category as string;
    }
    if (searchParams.color && searchParams.color !== 'all') {
      where.color = searchParams.color as string;
    }
    if (searchParams.Shown && searchParams.Shown !== 'all') {
      where.Shown = searchParams.Shown === 'true';
    }
    if (searchParams.isYarn && searchParams.isYarn !== 'all') {
      where.isYarn = searchParams.isYarn === 'true';
    }
    if (searchParams.minStock || searchParams.maxStock) {
      where.stock = {};
      if (searchParams.minStock) where.stock.gte = Number(searchParams.minStock);
      if (searchParams.maxStock) where.stock.lte = Number(searchParams.maxStock);
    }
    if (searchParams.minPrice || searchParams.maxPrice) {
      where.discountedPrice = {};
      if (searchParams.minPrice) where.discountedPrice.gte = Number(searchParams.minPrice);
      if (searchParams.maxPrice) where.discountedPrice.lte = Number(searchParams.maxPrice);
    }
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      brand: true, // Include brand information
    }
  })
  return products
}

export async function deleteproduct(id: string) {
  try {
    // Check if product exists and has any order items
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
      }
    })

    if (!product) {
      throw new Error("Product not found")
    }

    // Check if product has any order items
    if (product.orderItems.length > 0) {
      throw new Error("Cannot delete product: it is referenced in existing orders. Consider hiding it instead.")
    }

    // Proceed with deletion if no order items exist
    await prisma.product.delete({
      where: { id }
    })
    
    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
  } catch (error) {
    console.error("Error deleting product:", error)
    
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes("Cannot delete product")) {
      throw error
    }
    
    // Check if the error is due to foreign key constraints
    if ((error as any).code === 'P2003') {
      throw new Error("Cannot delete product: it is referenced in existing orders. Consider hiding it instead.")
    }
    
    throw new Error("Failed to delete product")
  }
}

// Alternative: Soft delete function (recommended for products with orders)
export async function hideProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { Shown: false },
    })
    
    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
  } catch (error) {
    console.error("Error hiding product:", error)
    throw new Error("Failed to hide product")
  }
}

// Force delete function (use with caution - this will delete order items)
export async function forceDeleteProduct(id: string) {
  try {
    // First delete all associated order items
    await prisma.orderItem.deleteMany({
      where: { productId: id }
    })
    
    // Then delete the product
    await prisma.product.delete({
      where: { id }
    })
    
    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
  } catch (error) {
    console.error("Error force deleting product:", error)
    throw new Error("Failed to delete product")
  }
}

export async function ToggleAvailability(id: string, isavail: boolean) {
  try {
    await prisma.product.update({
      where: { id },
      data: { Shown: !isavail },
    })
    
    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/admin/products')
  } catch (error) {
    console.error("Error toggling availability:", error)
    throw new Error("Failed to update product availability")
  }
}

// Helper function to get brands for the form
export async function getBrands() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
  return brands
}

// Additional function to safely delete a brand (if needed)
export async function deleteBrand(id: string) {
  try {
    // Check if brand has any products
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
      }
    })

    if (!brand) {
      throw new Error("Brand not found")
    }

    if (brand.products.length > 0) {
      throw new Error("Cannot delete brand: it has associated products")
    }

    await prisma.brand.delete({
      where: { id }
    })
    
    // Revalidate relevant paths
    revalidatePath('/admin/brands')
    revalidatePath('/products')
  } catch (error) {
    console.error("Error deleting brand:", error)
    throw new Error("Failed to delete brand")
  }
}