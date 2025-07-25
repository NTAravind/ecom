import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getproduct } from "@/lib/actions"
import Image from "next/image"
import { getColorName } from "@/lib/utils"
import prisma from "@/lib/prisma"
import { ProductCard } from "@/app/components/ProductCard"
import Header from "@/app/components/Header"
import BuyButton from "@/app/components/BuyNow"
import BuySection from "@/app/(Customerside)/components/BuySection"

import { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from "next/dynamic"
const ProductCarousel = dynamic(()=>import("../../components/ProductCourelel"))
// Types for better type safety
type StaticProductData = {
  id: string
  pname: string
  brandId: string
  originalPrice: number
  discountedPrice: number
  Shown: boolean
  irul: string
  iurl1: string
  desc: string
  y_weight: string
  weight_g: number
  category: string
  color: string
  isYarn: boolean
  brand: {
    id: string
    name: string
    discountRate: number
    isActive: boolean
  }
}

// Generate static params for all products at build time
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: {
      Shown: true,
      brand: {
        isActive: true
      }
    },
    select: { id: true }
  })

  return products.map((product) => ({
    id: product.id,
  }))
}

// Static product data (excluding stock)
async function getStaticProductData(id: string): Promise<StaticProductData | null> {
  const data = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      pname: true,
      brandId: true,
      originalPrice: true,
      discountedPrice: true,
      Shown: true,
      irul: true,
      iurl1: true,
      desc: true,
      y_weight: true,
      weight_g: true,
      category: true,
      color: true,
      isYarn: true,
      // Exclude stock from static data
      brand: {
        select: {
          id: true,
          name: true,
          discountRate: true,
          isActive: true
        }
      }
    }
  })
  
  return data
}

// Static similar products data (excluding stock)
async function getStaticSimilarProducts(category: string, currentProductId: string) {
  const simprods = await prisma.product.findMany({
    where: { 
      category: category,
      id: { not: currentProductId }, // Exclude current product
      Shown: true,
      brand: {
        isActive: true
      }
    },
    select: {
      id: true,
      pname: true,
      brandId: true,
      originalPrice: true,
      discountedPrice: true,
      Shown: true,
      irul: true,
      iurl1: true,
      desc: true,
      y_weight: true,
      weight_g: true,
      category: true,
      color: true,
      isYarn: true,
      brand: {
        select: {
          id: true,
          name: true,
          discountRate: true,
          isActive: true
        }
      }
    },
    take: 10,
  })
  
  return simprods
}

// Get only stock data dynamically
async function getStock(productId: string): Promise<number> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true }
    })
    
    return product?.stock || 0
  } catch (error) {
    console.error('Error fetching stock:', error)
    return 0
  }
}

// Dynamic stock component
async function StockInfo({ productId }: { productId: string }) {
  const stock = await getStock(productId)
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium min-w-[80px]">Stock:</span>
      <span className="text-muted-foreground">{stock} units available</span>
    </div>
  )
}

// Dynamic stock badge component
async function StockBadge({ productId, isShown }: { productId: string, isShown: boolean }) {
  const stock = await getStock(productId)
  
  return (
    <div className="flex items-center gap-3">
      {isShown && stock > 0 ? (
        <Badge variant="default" className="px-3 py-1">In Stock</Badge>
      ) : (
        <Badge variant="destructive" className="px-3 py-1">Out of Stock</Badge>
      )}
    </div>
  )
}

// Dynamic buy section wrapper
async function DynamicBuySection({ productData }: { productData: StaticProductData }) {
  const stock = await getStock(productData.id)
  const productWithStock = { ...productData, stock }
  
  return <BuySection prop={productWithStock} />
}

// Dynamic similar products with stock
async function DynamicSimilarProducts({ products }: { products: any[] }) {
  // Fetch stock for all similar products in parallel
  const productsWithStock = await Promise.all(
    products.map(async (product) => {
      const stock = await getStock(product.id)
      return { ...product, stock }
    })
  )
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
      {productsWithStock.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  )
}

export default async function ProductPage({ params }: { params: Promise<{id:string}>}) {
  const { id } = await params
  
  // Get static product data (built at build time)
  const data = await getStaticProductData(id)
  
  if (!data) {
    return <div className="text-center mt-10 text-destructive">Product not found.</div>
  }

  const color = getColorName(data.color)
  
  // Get static similar products data (built at build time)
  const simprods = await getStaticSimilarProducts(data.category, data.id)

  // Prepare images for carousel
  const productImages = [
    {
      url: data.irul || "/placeholder.png",
      alt: `${data.pname} - Main Image`,
      id: 1,
    },
    // Add more images if available
    ...(data.iurl1 ? [{
      url: data.iurl1,
      alt: `${data.pname} - Image 2`,
      id: 2,
    }] : []),
  ].filter(img => img.url && img.url !== "/placeholder.png")

  // Calculate discount display
  const hasDiscount = data.brand.discountRate > 0
  const discountPercentage = Math.round(data.brand.discountRate)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div className="flex justify-center items-start lg:relative lg:top:100px xl:relative xl:top-[100px]">
          <ProductCarousel 
            images={productImages}
            baseWidth={430}
            autoplay={true}
            autoplayDelay={4000}
            pauseOnHover={true}
            loop={true}
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{data.brand.name}, {data.pname}, {color} {data.y_weight} - {data.category}</h1>
          
          {/* Price section with discount */}
          <div className="space-y-2">
            {hasDiscount ? (
              <div className="flex items-center gap-3">
                <div className="text-2xl text-green-600 font-semibold">₹{data.discountedPrice}</div>
                <div className="text-lg text-muted-foreground line-through">₹{data.originalPrice}</div>
                <Badge variant="destructive" className="text-sm font-semibold">
                  -{discountPercentage}% OFF
                </Badge>
              </div>
            ) : (
              <div className="text-2xl text-green-600 font-semibold">₹{data.originalPrice}</div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Brand:</span>
              <span className="text-muted-foreground">{data.brand.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Color:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-full border border-border shadow-sm" 
                  style={{ backgroundColor: data.color }}
                />
                <span className="text-muted-foreground">{color}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Weight:</span>
              <span className="text-muted-foreground">{data.y_weight} ({data.weight_g}g)</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Material:</span>
              <span className="text-muted-foreground">{data.category}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Type:</span>
              <span className="text-muted-foreground">{data.isYarn ? 'Yarn' : 'Other'}</span>
            </div>

            {/* Dynamic stock info with Suspense */}
            <Suspense fallback={
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium min-w-[80px]">Stock:</span>
                <span className="text-muted-foreground animate-pulse">Loading...</span>
              </div>
            }>
              <StockInfo productId={data.id} />
            </Suspense>
          </div>
    
          {/* Dynamic stock badge with Suspense */}
          <Suspense fallback={
            <Badge variant="secondary" className="px-3 py-1 animate-pulse">Loading...</Badge>
          }>
            <StockBadge productId={data.id} isShown={data.Shown} />
          </Suspense>
          
          <div className="border-t pt-4">
            <p className="text-base leading-relaxed">{data.desc}</p>
          </div>
          
          <div className="pt-4">
            {/* Dynamic buy section with Suspense */}
            <Suspense fallback={
              <div className="animate-pulse">
                <div className="bg-gray-200 h-12 rounded mb-2"></div>
                <div className="bg-gray-200 h-8 rounded w-32"></div>
              </div>
            }>
              <DynamicBuySection productData={data} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="border-t pt-10">
        <Header>Similar Products</Header>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        }>
          <DynamicSimilarProducts products={simprods} />
        </Suspense>
      </div>
    </div>
  )
}

// Revalidate every 30 seconds for stock updates
export const revalidate = 1000