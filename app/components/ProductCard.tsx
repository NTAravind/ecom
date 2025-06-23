import Link from "next/link";
import { Product } from "../generated/prisma";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { fcurrency } from "@/utils/utils";
import { getColorName } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 w-48">
      <Link href={`/products/${product.id}`}>
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square">
          <Image 
            src={product.irul} 
            height={150} 
            width={150} 
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200" 
            alt={product.pname} 
            unoptimized
          />
        </div>
        
        <div className="p-3 space-y-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-xl leading-tight mb-1">
              {product.pname}
            </h3>
            <div className="flex  gap-1 text-xm text-gray-500 ">
              <span className="truncate">{product.category}</span>
              <span>•</span>
              <span>{product.y_weight}</span>
             ,<br></br>
              <span>{getColorName(product.color)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-gray-900">
              {fcurrency(product.price)}
            </span>
            
            <Button 
              className="bg-black hover:bg-gray-800 text-white rounded px-3 py-1 text-xs font-medium transition-colors"
            >
              Add
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}