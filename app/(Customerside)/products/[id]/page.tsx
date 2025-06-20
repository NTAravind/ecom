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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="flex justify-center items-start">
        <Image
          src={data.iurl1 || "/placeholder.png"}
          alt={data.pname || "Product Image"}
          width={500}
          height={500}
          className="rounded-xl object-contain border shadow-md"
          unoptimized
        />
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{data.brand}, {data.pname}, {color} {data.y_weight} - {data.category}</h1>
        <div className="text-2xl text-green-600 font-semibold">₹{data.price}</div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Category:</span> {data.category}</p>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Color:</span>
            <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: data.color }}></div>
          </div>
          <p><span className="font-medium text-foreground">Weight:</span> {data.y_weight}</p>
        </div>
        <p className="text-base text-foreground">{data.desc}</p>
        {data.Shown ? (
          <Badge variant="default">In Stock</Badge>
        ) : (
          <Badge variant="destructive">Out of Stock</Badge>
        )}
        <div className="flex gap-4 mt-6">
          <BuySection prop={data} />
        </div>
      </div>

      <div className="block my-10 col-span-2">
        <Header>Similar Products</Header>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {simprods.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    </div>
  )
}
