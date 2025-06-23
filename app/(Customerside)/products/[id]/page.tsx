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
import ProductCarousel from "../../components/ProductCourelel"
import { Metadata } from 'next'

export default async function ProductPage({ params }: { params: Promise<{id:string}>}) {
  const { id } = await params
  const data = await getproduct(id)
  if (!data) {
    return <div className="text-center mt-10 text-destructive">Product not found.</div>
  }

  const color = getColorName(data?.color)
  const simprods = await prisma.product.findMany({
    where: { category: data?.category },
    take: 10,
  })

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div className="flex justify-center items-start">
          <ProductCarousel 
            images={productImages}
            baseWidth={500}
            autoplay={true}
            autoplayDelay={4000}
            pauseOnHover={true}
            loop={true}
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{data.brand}, {data.pname}, {color} {data.y_weight} - {data.category}</h1>
          
          <div className="text-2xl text-green-600 font-semibold">₹{data.price}</div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Category:</span>
              <span className="text-muted-foreground">{data.category}</span>
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
              <span className="text-muted-foreground">{data.y_weight}</span>
            </div>
              <div className="flex items-center gap-2 text-sm">
              <span className="font-medium min-w-[80px]">Material:</span>
              <span className="text-muted-foreground">{data.category}</span>
            </div>
          </div>
    
       

          <div className="flex items-center gap-3">
            {data.Shown ? (
              <Badge variant="default" className="px-3 py-1">In Stock</Badge>
            ) : (
              <Badge variant="destructive" className="px-3 py-1">Out of Stock</Badge>
            )}
          </div>
               <div className="border-t pt-4">
            <p className="text-base leading-relaxed">{data.desc}</p>
          </div>
          <div className="pt-4">
            <BuySection prop={data} />
          </div>
        </div>
      </div>

      <div className="border-t pt-10">
        <Header>Similar Products</Header>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {simprods.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    </div>
  )
}