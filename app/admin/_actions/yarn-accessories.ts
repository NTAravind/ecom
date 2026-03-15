"use server"
import prisma from "@/lib/prisma"
import z from "zod"
import { revalidatePath } from "next/cache"

const yarnAccessorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  originalPrice: z.coerce.number().int().min(1, "Original price must be at least 1"),
  discountedPrice: z.coerce.number().int().min(1, "Discounted price must be at least 1"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().min(1, "Image URL is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  isActive: z.string().transform((val) => val === "true"),
})

export async function addYarnAccessory(prevState: unknown, formdata: FormData) {
  const res = yarnAccessorySchema.safeParse(Object.fromEntries(formdata.entries()))
  
  if (res.success === false) {
    return { message: res.error.errors[0]?.message || "Validation failed" }
  }

  const data = res.data

  try {
    await prisma.yarnAccessory.create({
      data: {
        name: data.name,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        stock: data.stock,
        imageUrl: data.imageUrl,
        description: data.description,
        category: data.category,
        isActive: data.isActive,
      }
    })

    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
    
    return { message: "" }
  } catch (error) {
    console.error("Error adding yarn accessory:", error)
    return { message: "Failed to add yarn accessory. Please try again." }
  }
}

export async function updateYarnAccessory(id: string, prevState: unknown, formdata: FormData) {
  const res = yarnAccessorySchema.safeParse(Object.fromEntries(formdata.entries()))
  
  if (res.success === false) {
    return { message: res.error.errors[0]?.message || "Validation failed" }
  }

  const data = res.data

  try {
    await prisma.yarnAccessory.update({
      where: { id },
      data: {
        name: data.name,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        stock: data.stock,
        imageUrl: data.imageUrl,
        description: data.description,
        category: data.category,
        isActive: data.isActive,
      }
    })

    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
    
    return { message: "" }
  } catch (error) {
    console.error("Error updating yarn accessory:", error)
    return { message: "Failed to update yarn accessory. Please try again." }
  }
}

export async function getYarnAccessoriesTable(searchParams?: { [key: string]: string | string[] | undefined }) {
  const where: any = {};
  
  if (searchParams) {
    if (searchParams.name) {
      where.name = { contains: searchParams.name as string, mode: 'insensitive' };
    }
    if (searchParams.category && searchParams.category !== 'all') {
      where.category = searchParams.category as string;
    }
    if (searchParams.isActive && searchParams.isActive !== 'all') {
      where.isActive = searchParams.isActive === 'true';
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

  const accessories = await prisma.yarnAccessory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return accessories
}

export async function getYarnAccessoryById(id: string) {
  const accessory = await prisma.yarnAccessory.findUnique({
    where: { id },
  })
  return accessory
}

export async function deleteYarnAccessory(id: string) {
  try {
    const accessory = await prisma.yarnAccessory.findUnique({
      where: { id },
      include: {
        orderItems: true,
      }
    })

    if (!accessory) {
      throw new Error("Yarn accessory not found")
    }

    if (accessory.orderItems.length > 0) {
      throw new Error("Cannot delete: it is referenced in existing orders. Consider hiding it instead.")
    }

    await prisma.yarnAccessory.delete({
      where: { id }
    })
    
    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
  } catch (error) {
    console.error("Error deleting yarn accessory:", error)
    
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      throw error
    }
    
    if ((error as any).code === 'P2003') {
      throw new Error("Cannot delete: it is referenced in existing orders. Consider hiding it instead.")
    }
    
    throw new Error("Failed to delete yarn accessory")
  }
}

export async function toggleYarnAccessoryAvailability(id: string, isActive: boolean) {
  try {
    await prisma.yarnAccessory.update({
      where: { id },
      data: { isActive: !isActive },
    })
    
    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
  } catch (error) {
    console.error("Error toggling availability:", error)
    throw new Error("Failed to update availability")
  }
}

export async function updateYarnAccessoryStock(id: string, stock: number) {
  try {
    await prisma.yarnAccessory.update({
      where: { id },
      data: { stock },
    })
    
    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
    return { success: true }
  } catch (error) {
    console.error("Error updating stock:", error)
    return { success: false, error: "Failed to update stock" }
  }
}

export async function updateYarnAccessoryDiscount(id: string, discountedPrice: number) {
  try {
    await prisma.yarnAccessory.update({
      where: { id },
      data: { discountedPrice },
    })
    
    revalidatePath('/')
    revalidatePath('/admin/yarn-accessories')
    return { success: true }
  } catch (error) {
    console.error("Error updating discount:", error)
    return { success: false, error: "Failed to update discount" }
  }
}

export async function getYarnAccessoryCategories() {
  const categories = await prisma.yarnAccessory.findMany({
    select: { category: true },
    distinct: ['category'],
  })
  return categories.map(c => c.category).filter(Boolean)
}
