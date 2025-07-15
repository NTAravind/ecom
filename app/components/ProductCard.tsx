import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { Product } from "../generated/prisma";
import { fcurrency } from "@/utils/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCardActions } from "./Productcardclient";

type ProductCardProps = {
  product: Product & {
    category?: string;
    y_weight?: string;
    stock_quantity?: number;
  };
};

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  // Memoize computed values
  const imageUrl = product.irul || '/placeholder-image.jpg';
  const stockQuantity = product.stock_quantity ?? 20;
  const isInStock = stockQuantity > 0;
  const category = product.category || 'Yarn';

  return (
    <Card className="group w-full bg-white rounded-xl border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-violet-200">
      <div className="flex flex-col h-full">
        {/* Image section */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.pname || 'Product image'}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-600 border-0"
          >
            {category}
          </Badge>
        </div>

        {/* Content section */}
        <Link href={`/products/${product.id}`} className="flex-1">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <h3 className="font-medium text-slate-800 leading-snug line-clamp-2 group-hover:text-violet-800 transition-colors">
                {product.pname}
              </h3>
              
              {product.y_weight && (
                <p className="text-sm text-slate-500">{product.y_weight}</p>
              )}
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-violet-900">
                  {fcurrency(product.price)}
                </span>
                
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                  isInStock
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-rose-700 bg-rose-100'
                }`}>
                  {isInStock ? 'In Stock' : 'Sold Out'}
                </div>
              </div>
              
              <ProductCardActions product={product} />
            </div>
          </CardContent>
        </Link>
      </div>
    </Card>
  );
});

export { ProductCard };