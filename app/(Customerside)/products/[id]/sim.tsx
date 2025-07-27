import prisma from "@/lib/prisma"
import Header from "@/app/components/Header"
import { ProductCard } from "@/app/components/ProductCard"
export async function SimilarProductsSection({data}:{data:{category:string,id:string}}){
    async function getStaticSimilarProducts(category: string, currentProductId: string) {
  const simprods = await prisma.product.findMany({
    where: { 
      category: category,
      id: { not: currentProductId },
      Shown: true,
      brand: {
        isActive: true
      }
    },
    select: {
      id: true,
      pname: true,
      brandId: true,
      Shown: true,
      irul: true,
      iurl1: true,
      desc: true,
      y_weight: true,
      weight_g: true,
      category: true,
      color: true,
      isYarn: true,
      // Include static pricing for similar products (cached)
      originalPrice: true,
      discountedPrice: true,
      stock: true,
      brand: {
        select: {
          id: true,
          name: true,
          discountRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    take: 10,
  })
  
  return simprods
}

    const simprods = await getStaticSimilarProducts(data.category, data.id)
    return(<>
       <Header>Similar Products</Header>
        {/* Static similar products - no suspense needed, but lazy load for better UX */}
        <div className="mt-6">
          <StaticSimilarProducts products={simprods} />
        </div>
    </>)
}
function StaticSimilarProducts({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
      {products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  )
}