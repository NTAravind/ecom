"use server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import z from "zod"
import { revalidatePath } from "next/cache"

// Updated schema to match your new database structure
const formdat = z.object({
  name: z.string().min(1, "Product name is required"),
  brandId: z.string().min(1, "Brand selection is required"),
  url: z.string().min(1, "Primary image URL is required"),
  url2: z.string().min(1, "Secondary image URL is required"),
  originalPrice: z.coerce.number().int().min(1, "Original price must be at least 1"),
  discountedPrice: z.coerce.number().int().min(1, "Discounted price must be at least 1"),
  category: z.string().min(1, "Category is required"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  color: z.string().min(1, "Color is required"),
  weight: z.string().min(1, "Yarn weight is required"),
  desc: z.string().min(1, "Description is required"),
  gweight: z.coerce.number().int().min(25, "Weight must be at least 25g"),
  shown: z.string().transform((val) => val === "true"), // Convert string to boolean
})

export async function addProduct(prevState: unknown, formdata: FormData) {
  const res = formdat.safeParse(Object.fromEntries(formdata.entries()))
  
  if (res.success === false) {
    return { message: res.error.errors[0]?.message || "Validation failed" }
  }

  const data = res.data

  try {
    await prisma.product.create({
      data: {
        pname: data.name,
        brandId: data.brandId,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        desc: data.desc,
        category: data.category,
        irul: data.url,
        iurl1: data.url2,
        stock: data.stock,
        color: data.color,
        y_weight: data.weight,
        weight_g: data.gweight,
        Shown: data.shown,
        isYarn: true, // Default to true for yarn products
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
    await prisma.product.update({
      where: { id },
      data: {
        pname: data.name,
        brandId: data.brandId,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        desc: data.desc,
        category: data.category,
        irul: data.url,
        iurl1: data.url2,
        stock: data.stock,
        color: data.color,
        y_weight: data.weight,
        weight_g: data.gweight,
        Shown: data.shown,
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

export async function ProductsTable() {
  const products = await prisma.product.findMany({
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
    if (error.message.includes("Cannot delete product")) {
      throw error
    }
    
    // Check if the error is due to foreign key constraints
    if (error.code === 'P2003') {
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