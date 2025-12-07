'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Brand } from '@/app/generated/prisma'

type ActionResponse<T = undefined> = {
  success: boolean
  error: string | null
  fieldErrors?: Record<string, string[]>
  message: string
  data?: T
}

type BrandWithCount = Brand & {
  _count: {
    products: number
  }
}

// Updated validation schema to include inherited properties
const brandSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  discountRate: z.coerce.number()
    .min(0, 'Discount rate cannot be negative')
    .max(100, 'Discount rate cannot exceed 100%'),
  isActive: z.string().transform((val) => val === 'on'), // Convert 'on'/'off' to boolean
  category: z.string().min(1, 'Fiber content is required'),
  weight: z.string().min(1, 'Yarn weight is required'),
  gweight: z.coerce.number()
    .min(25, 'Weight must be at least 25g')
    .int('Weight must be a whole number'),
  desc: z.string().min(1, 'Description is required'),
  iurl1: z.string().optional().default('')
})

function revalidateBrandPaths(brandId?: string) {
  revalidatePath('/brands')
  revalidatePath('/products')
  revalidatePath('/admin/brands')
  revalidatePath('/admin/products')
  if (brandId) {
    revalidatePath(`/brands/${brandId}`)
    revalidatePath(`/admin/brands/${brandId}`)
  }
}

export async function createBrand(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Brand>> {
  try {
    const data = {
      name: formData.get('name') as string,
      discountRate: formData.get('discountRate') as string,
      isActive: formData.get('isActive') as string || 'off',
      category: formData.get('category') as string,
      weight: formData.get('weight') as string,
      gweight: formData.get('gweight') as string,
      desc: formData.get('desc') as string,
      iurl1: (formData.get('iurl1') as string) || ''
    }

    const validatedData = brandSchema.parse(data)

    const existingBrand = await prisma.brand.findUnique({
      where: { name: validatedData.name }
    })

    if (existingBrand) {
      return {
        success: false,
        error: 'A brand with this name already exists',
        fieldErrors: { name: ['This brand name is already taken'] },
        message: 'A brand with this name already exists'
      }
    }

    const newBrand = await prisma.brand.create({
      data: {
        name: validatedData.name,
        discountRate: validatedData.discountRate,
        isActive: validatedData.isActive,
        category: validatedData.category,
        y_weight: validatedData.weight,
        weight_g: validatedData.gweight,
        desc: validatedData.desc,
        defaultImageUrl: validatedData.iurl1 || 'https://cdn.jsdelivr.net/gh/username/repo@main/default-brand.jpg'
      }
    })

    revalidateBrandPaths(newBrand.id)

    return {
      success: true,
      error: null,
      fieldErrors: {},
      message: 'Brand created successfully',
      data: newBrand
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Please check your input and try again',
        fieldErrors: error.flatten().fieldErrors,
        message: 'Please check your input and try again'
      }
    }

    console.error('Error creating brand:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      fieldErrors: {},
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function updateBrand(
  id: string,
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Brand>> {
  try {
    const data = {
      name: formData.get('name') as string,
      discountRate: formData.get('discountRate') as string,
      isActive: formData.get('isActive') as string || 'off',
      category: formData.get('category') as string,
      weight: formData.get('weight') as string,
      gweight: formData.get('gweight') as string,
      desc: formData.get('desc') as string,
      iurl1: (formData.get('iurl1') as string) || ''
    }

    const validatedData = brandSchema.parse(data)

    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    })

    if (!existingBrand) {
      return {
        success: false,
        error: 'Brand not found',
        fieldErrors: {},
        message: 'Brand not found'
      }
    }

    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id }
      }
    })

    if (duplicateBrand) {
      return {
        success: false,
        error: 'A brand with this name already exists',
        fieldErrors: { name: ['This brand name is already taken'] },
        message: 'A brand with this name already exists'
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name: validatedData.name,
        discountRate: validatedData.discountRate,
        isActive: validatedData.isActive,
        category: validatedData.category,
        y_weight: validatedData.weight,
        weight_g: validatedData.gweight,
        desc: validatedData.desc,
        defaultImageUrl: validatedData.iurl1 || existingBrand.defaultImageUrl
      }
    })

    revalidateBrandPaths(id)

    return {
      success: true,
      error: null,
      fieldErrors: {},
      message: 'Brand updated successfully',
      data: updatedBrand
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Please check your input and try again',
        fieldErrors: error.flatten().fieldErrors,
        message: 'Please check your input and try again'
      }
    }

    console.error('Error updating brand:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      fieldErrors: {},
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function getBrands(): Promise<ActionResponse<BrandWithCount[]>> {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return {
      success: true,
      data: brands,
      error: null,
      message: 'Brands fetched successfully'
    }
  } catch (error) {
    console.error('Failed to fetch brands:', error)
    return {
      success: false,
      error: 'Failed to fetch brands',
      message: 'Failed to fetch brands'
    }
  }
}

export async function getBrandById(id: string): Promise<ActionResponse<BrandWithCount>> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!brand) {
      return {
        success: false,
        error: 'Brand not found',
        message: 'Brand not found'
      }
    }

    return {
      success: true,
      data: brand,
      error: null,
      message: 'Brand fetched successfully'
    }
  } catch (error) {
    console.error('Failed to fetch brand:', error)
    return {
      success: false,
      error: 'Failed to fetch brand',
      message: 'Failed to fetch brand'
    }
  }
}

export async function updateBrandStatus(
  id: string,
  isActive: boolean
): Promise<ActionResponse<BrandWithCount>> {
  try {
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { isActive },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    revalidateBrandPaths(id)

    return {
      success: true,
      data: updatedBrand,
      error: null,
      message: 'Brand status updated successfully'
    }
  } catch (error) {
    console.error('Failed to update brand status:', error)
    return {
      success: false,
      error: 'Failed to update brand status',
      message: 'Failed to update brand status'
    }
  }
}

export async function updateBrandDiscount(
  id: string,
  discountRate: number
): Promise<ActionResponse<BrandWithCount>> {
  try {
    if (discountRate < 0 || discountRate > 100) {
      return {
        success: false,
        error: 'Discount rate must be between 0 and 100',
        message: 'Discount rate must be between 0 and 100'
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBrand = await tx.brand.update({
        where: { id },
        data: { discountRate },
        include: {
          _count: {
            select: { products: true }
          }
        }
      })

      const products = await tx.product.findMany({
        where: { brandId: id },
        select: { id: true, originalPrice: true }
      })

      if (products.length > 0) {
        const updatePromises = products.map(product => {
          const discountAmount = (product.originalPrice * discountRate) / 100
          const newDiscountedPrice = Math.round(product.originalPrice - discountAmount)

          return tx.product.update({
            where: { id: product.id },
            data: { discountedPrice: newDiscountedPrice }
          })
        })

        await Promise.all(updatePromises)
      }

      return updatedBrand
    })

    revalidateBrandPaths(id)

    return {
      success: true,
      data: result,
      error: null,
      message: `Updated brand discount and recalculated prices for ${result._count.products} product${result._count.products !== 1 ? 's' : ''}`
    }
  } catch (error) {
    console.error('Failed to update brand discount:', error)
    return {
      success: false,
      error: 'Failed to update brand discount',
      message: 'Failed to update brand discount'
    }
  }
}

export async function deleteBrand(id: string): Promise<ActionResponse> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!brand) {
      return {
        success: false,
        error: 'Brand not found',
        message: 'Brand not found'
      }
    }

    await prisma.brand.delete({
      where: { id }
    })

    revalidateBrandPaths()

    return {
      success: true,
      error: null,
      message: `Brand deleted successfully${brand._count.products > 0 ? ` along with ${brand._count.products} associated product${brand._count.products !== 1 ? 's' : ''}` : ''}`
    }
  } catch (error) {
    console.error('Failed to delete brand:', error)
    return {
      success: false,
      error: 'Failed to delete brand',
      message: 'Failed to delete brand. Please ensure no products are associated with it.'
    }
  }
}