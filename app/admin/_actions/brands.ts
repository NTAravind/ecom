'use server'
import { prisma } from '@/lib/prisma'
import { error } from 'console'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { success } from 'zod/v4'

const createBrandSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  discountRate: z.coerce.number()
    .min(0, 'Discount rate cannot be negative')
    .max(100, 'Discount rate cannot exceed 100%'),
  isActive: z.boolean().default(true)
})

// For update, we don't need id in the schema since it's passed separately
const updateBrandSchema = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  discountRate: z.coerce.number()
    .min(0, 'Discount rate cannot be negative')
    .max(100, 'Discount rate cannot exceed 100%'),
  isActive: z.boolean().default(true)
})

export async function updateBrand(id: string, prevState: any, formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      discountRate: formData.get('discountRate') as string,
      isActive: formData.get('isActive') === 'on'
    }

    const validatedData = updateBrandSchema.parse(data)

    // Check if the brand exists
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

    // Check if another brand with the same name exists (excluding current brand)
    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id } // Use the id parameter directly
      }
    })

    if (duplicateBrand) {
      return {
        success: false,
        error: 'A brand with this name already exists',
        fieldErrors: {
          name: 'This brand name is already taken'
        },
        message: 'A brand with this name already exists'
      }
    }

    // Update the brand
    await prisma.brand.update({
      where: { id }, // Use the id parameter directly
      data: {
        name: validatedData.name,
        discountRate: validatedData.discountRate,
        isActive: validatedData.isActive
      }
    })

    // Revalidate relevant pages
    revalidatePath('/brands')
    revalidatePath(`/brands/${id}`)

    return {
      success: true,
      error: null,
      fieldErrors: {},
      message: "Brand updated successfully"
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

export async function createBrand(prevState: any, formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      discountRate: formData.get('discountRate') as string,
      isActive: formData.get('isActive') === 'on'
    }

    const validatedData = createBrandSchema.parse(data)

    // Check if brand name already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { name: validatedData.name }
    })

    if (existingBrand) {
      return {
        success: false,
        error: 'A brand with this name already exists',
        fieldErrors: {
          name: 'This brand name is already taken'
        },
        message: 'A brand with this name already exists'
      }
    }

    // Create the brand
    await prisma.brand.create({
      data: {
        name: validatedData.name,
        discountRate: validatedData.discountRate,
        isActive: validatedData.isActive
      }
    })

    // Revalidate the brands page
    revalidatePath('/brands')
 revalidatePath('/products')
    return {
      success: true,
      error: null,
      fieldErrors: {},
      message: "Brand created successfully"
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


export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return { success: true, data: brands }
  } catch (error) {
    console.error('Failed to fetch brands:', error)
    return { success: false, error: 'Failed to fetch brands' }
  }
}

export async function getBrandById(id: string) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
    
    if (!brand) {
      return { success: false, error: 'Brand not found' }
    }
    
    return { success: true, data: brand }
  } catch (error) {
    console.error('Failed to fetch brand:', error)
    return { success: false, error: 'Failed to fetch brand' }
  }
}

export async function updateBrandStatus(id: string, isActive: boolean) {
  try {
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { isActive },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
    
    revalidatePath('/admin/brands')
     revalidatePath('/products')
    return { success: true, data: updatedBrand }
  } catch (error) {
    console.error('Failed to update brand status:', error)
    return { success: false, error: 'Failed to update brand status' }
  }
}

export async function updateBrandDiscount(id: string, discountRate: number) {
  try {
    // Validate discount rate
    if (discountRate < 0 || discountRate > 100) {
      return {
        success: false,
        error: 'Discount rate must be between 0 and 100'
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the brand's discount rate
      const updatedBrand = await tx.brand.update({
        where: { id },
        data: { discountRate },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      // Get all products for this brand to recalculate their discounted prices
      const products = await tx.product.findMany({
        where: { brandId: id },
        select: {
          id: true,
          originalPrice: true
        }
      })

      // Recalculate and update discounted prices for all products
      const updatePromises = products.map(product => {
        const discountAmount = (product.originalPrice * discountRate) / 100
        const newDiscountedPrice = Math.round(product.originalPrice - discountAmount)
        
        return tx.product.update({
          where: { id: product.id },
          data: { discountedPrice: newDiscountedPrice }
        })
      })

      // Execute all product updates
      await Promise.all(updatePromises)

      return updatedBrand
    })

    revalidatePath('/admin/brands')
    revalidatePath('/products')
    
    return { 
      success: true, 
      data: result,
      message: `Updated brand discount and recalculated prices for ${result._count.products} products`
    }
    
  } catch (error) {
    console.error('Failed to update brand discount:', error)
    return { success: false, error: 'Failed to update brand discount' }
  }
}

export async function DeleteBrand(id:string){
  try{
    const DeleteBrand = await prisma.brand.delete({where:{id}})
      revalidatePath('/admin/brands')
       revalidatePath('/products')
    return{success:true,error:'Deleted brand and Products belonging to it'}
  }catch(err){console.log(err) 
     return{success:false,error:'failed'}}
  

}

//price validation 
