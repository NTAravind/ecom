import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/prisma"
import { YarnAccessoryCard } from "@/app/components/YarnAccessoryCard"
import Header from "@/app/components/Header"
import YarnAccessoryBuySection from "@/app/(Customerside)/components/YarnAccessoryBuySection"
import { Suspense } from 'react'
import dynamic from "next/dynamic"
import { fcurrency } from "@/utils/utils"

const ProductCarousel = dynamic(()=>import("../../components/ProductCourelel"))

type StaticAccessoryData = {
  id: string
  name: string
  isActive: boolean
  imageUrl: string
  description: string
  category: string
}

type DynamicAccessoryData = {
  originalPrice: number
  discountedPrice: number
  stock: number
}

type FullAccessoryData = StaticAccessoryData & DynamicAccessoryData

async function getStaticAccessoryData(id: string): Promise<StaticAccessoryData | null> {
  const data = await prisma.yarnAccessory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isActive: true,
      imageUrl: true,
      description: true,
      category: true,
    }
  })
  
  return data
}

async function getStaticSimilarAccessories(category: string, currentAccessoryId: string) {
  const simAccessories = await prisma.yarnAccessory.findMany({
    where: { 
      category: category,
      id: { not: currentAccessoryId },
      isActive: true,
    },
    take: 10,
  })
  
  return simAccessories
}

async function getDynamicAccessoryData(accessoryId: string): Promise<DynamicAccessoryData> {
  try {
    const accessory = await prisma.yarnAccessory.findUnique({
      where: { id: accessoryId },
      select: { 
        originalPrice: true,
        discountedPrice: true,
        stock: true 
      }
    })
    
    return {
      originalPrice: accessory?.originalPrice || 0,
      discountedPrice: accessory?.discountedPrice || 0,
      stock: accessory?.stock || 0
    }
  } catch (error) {
    console.error('Error fetching dynamic accessory data:', error)
    return {
      originalPrice: 0,
      discountedPrice: 0,
      stock: 0
    }
  }
}

async function getDynamicAccessoriesData(accessoryIds: string[]): Promise<Record<string, DynamicAccessoryData>> {
  try {
    const accessories = await prisma.yarnAccessory.findMany({
      where: { 
        id: { in: accessoryIds }
      },
      select: { 
        id: true,
        originalPrice: true,
        discountedPrice: true,
        stock: true 
      }
    })
    
    const dynamicData: Record<string, DynamicAccessoryData> = {}
    accessories.forEach(accessory => {
      dynamicData[accessory.id] = {
        originalPrice: accessory.originalPrice,
        discountedPrice: accessory.discountedPrice,
        stock: accessory.stock
      }
    })
    
    return dynamicData
  } catch (error) {
    console.error('Error fetching dynamic accessories data:', error)
    return {}
  }
}

async function PriceSection({ accessoryId }: { accessoryId: string }) {
  const { originalPrice, discountedPrice } = await getDynamicAccessoryData(accessoryId)
  
  const hasDiscount = originalPrice > discountedPrice
  const discountPercentage = hasDiscount ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0

  return (
    <div className="space-y-2">
      {hasDiscount ? (
        <div className="flex items-center gap-3">
          <div className="text-2xl text-green-600 font-semibold">₹{discountedPrice}</div>
          <div className="text-lg text-muted-foreground line-through">₹{originalPrice}</div>
          <Badge variant="destructive" className="text-sm font-semibold">
            -{discountPercentage}% OFF
          </Badge>
        </div>
      ) : (
        <div className="text-2xl text-green-600 font-semibold">₹{originalPrice}</div>
      )}
    </div>
  )
}

async function StockInfo({ accessoryId }: { accessoryId: string }) {
  const { stock } = await getDynamicAccessoryData(accessoryId)
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium min-w-[80px]">Stock:</span>
      <span className="text-muted-foreground">{stock} units available</span>
    </div>
  )
}

async function StockBadge({ accessoryId, isActive }: { accessoryId: string, isActive: boolean }) {
  const { stock } = await getDynamicAccessoryData(accessoryId)
  
  return (
    <div className="flex items-center gap-3">
      {isActive && stock > 0 ? (
        <Badge variant="default" className="px-3 py-1">In Stock</Badge>
      ) : (
        <Badge variant="destructive" className="px-3 py-1">Out of Stock</Badge>
      )}
    </div>
  )
}

async function DynamicBuySection({ accessoryData }: { accessoryData: StaticAccessoryData }) {
  const dynamicData = await getDynamicAccessoryData(accessoryData.id)
  const fullAccessoryData = { ...accessoryData, ...dynamicData }

  return <YarnAccessoryBuySection prop={fullAccessoryData} />
}

async function DynamicSimilarAccessories({ accessories }: { accessories: StaticAccessoryData[] }) {
  const accessoryIds = accessories.map(a => a.id)
  const dynamicData = await getDynamicAccessoriesData(accessoryIds)
  
  const accessoriesWithDynamicData = accessories.map(accessory => ({
    ...accessory,
    ...dynamicData[accessory.id]
  }))
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
      {accessoriesWithDynamicData.map((accessory) => (
        <YarnAccessoryCard accessory={accessory} key={accessory.id} />
      ))}
    </div>
  )
}

export default async function YarnAccessoryPage({ params }: { params: Promise<{id:string}>}) {
  const { id } = await params
  
  const data = await getStaticAccessoryData(id)
  
  if (!data) {
    return <div className="text-center mt-10 text-destructive">Accessory not found.</div>
  }
  
  const simAccessories = await getStaticSimilarAccessories(data.category, data.id)

  const productImages = [
    {
      url: data.imageUrl || "/placeholder.png",
      alt: `${data.name} - Main Image`,
      id: 1,
    },
  ].filter(img => img.url && img.url !== "/placeholder.png")

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div className="flex justify-center items-start lg:relative lg:top-[100px] xl:relative xl:top-[100px]">
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
          <h1 className="text-3xl font-bold">{data.name}</h1>
          
          <Suspense fallback={
            <div className="space-y-2">
              <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
            </div>
          }>
            <PriceSection accessoryId={data.id} />
          </Suspense>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Category:</span>
              <span className="text-muted-foreground">{data.category}</span>
            </div>
            
            <Suspense fallback={
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium min-w-[80px]">Stock:</span>
                <span className="text-muted-foreground animate-pulse">Loading...</span>
              </div>
            }>
              <StockInfo accessoryId={data.id} />
            </Suspense>
          </div>
    
          <Suspense fallback={
            <Badge variant="secondary" className="px-3 py-1 animate-pulse">Loading...</Badge>
          }>
            <StockBadge accessoryId={data.id} isActive={data.isActive} />
          </Suspense>
          
          <div className="border-t pt-4">
            <p className="text-base leading-relaxed">{data.description}</p>
          </div>
          
          <div className="pt-4">
            <Suspense fallback={
              <div className="animate-pulse">
                <div className="bg-gray-200 h-12 rounded mb-2"></div>
                <div className="bg-gray-200 h-8 rounded w-32"></div>
              </div>
            }>
              <DynamicBuySection accessoryData={data} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="border-t pt-10">
        <Header>Similar Accessories</Header>
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
          <DynamicSimilarAccessories accessories={simAccessories} />
        </Suspense>
      </div>
    </div>
  )
}

export const revalidate = 86400
