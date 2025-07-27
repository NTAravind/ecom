// app/sitemap.ts
import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://patelyarnhouse.com' // Replace with your actual domain
  
  try {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/bulk-orders`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/cart`,
        lastModified: new Date(),
        changeFrequency: 'never',
        priority: 0.3,
      },
    ]

    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { 
        Shown: true,
        stock: {
          gt: 0 // Only include products in stock
        }
      },
      select: {
        id: true,
        pname: true,
       
      },
   
    })

    // Generate product pages
    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Fetch all active brands
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            Shown: true,
            stock: {
              gt: 0
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Generate brand pages using brand name as URL parameter
    const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${baseUrl}/products?brand=${encodeURIComponent(brand.name)}`,
      lastModified: brand.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Fetch categories if you have them

    // Generate category pages (if categories exist)

    // Additional pages you might have
    const additionalPages: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: 'never',
        priority: 0.4,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms-of-service`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/shipping-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/return-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ]

    // Combine all pages
    const allPages = [
      ...staticPages,
      ...productPages,
      ...brandPages,
    
      ...additionalPages,
    ]

    console.log(`Generated sitemap with ${allPages.length} URLs`)
    
    return allPages

  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Fallback sitemap with just static pages
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ]
  }
}

// Optional: Add revalidation for the sitemap itself
export const revalidate = 86400 // Revalidate sitemap daily (24 hours)