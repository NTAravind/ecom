import Link from "next/link";
import { Product } from "../generated/prisma";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";
import { fcurrency } from "@/utils/utils";
import { getColorName } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  console.log("url", product.irul);
  return (
    <Card className="group bg-white border border-black shadow-sm hover:shadow-lg transition-all duration-500 w-full max-w-sm mx-auto">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-[4/3] bg-white border-b border-black overflow-hidden">
          <Image
            src={product.irul}
            height={400}
            width={400}
            className="object-contain w-full h-full p-2 sm:p-3 group-hover:scale-105 transition-transform duration-700"
            alt={product.pname}
            unoptimized
          />
        </div>
        <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-semibold text-black text-sm sm:text-base lg:text-lg leading-tight line-clamp-2 mb-1">
                {product.pname}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6 pb-4">
          <Badge variant="outline" className="text-xs border-black text-black flex-shrink-0 w-fit">
            {product.category}
          </Badge>
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 text-xs sm:text-sm text-black">
              <span className="font-medium">Weight:</span>
              <span>{product.y_weight}</span>
            </div>
            
            {product.color && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-black">
                <span className="font-medium">Color:</span>
                <span className="font-light">{getColorName(product.color)}</span>
              </div>
            )}
          </div>
          
          <Separator className="my-3 bg-black" />
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-xl sm:text-2xl font-light text-black">
              {fcurrency(product.price)}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}