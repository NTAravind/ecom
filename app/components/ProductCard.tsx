import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { Product, Brand } from "../generated/prisma";
import { fcurrency } from "@/utils/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCardActions } from "./Productcardclient";

type ProductCardProps = {
  product: Product & {
    brand: Brand;
    category?: string;
    y_weight?: string;
  };
};

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  // --- Memoized values for performance ---
  const imageUrl = product.irul || '/placeholder-image.jpg';
  const isInStock = product.stock > 0;
  const category = product.category || 'Yarn';
  const brandName = product.brand?.name || 'Unknown Brand';
  const discountRate = product.brand?.discountRate || 0;
  
  // --- Price calculation logic ---
  const originalPrice = product.originalPrice;
  const discountedPrice = product.discountedPrice;
  const hasDiscount = discountRate > 0 && originalPrice > discountedPrice;

  return (
    <Card className="group flex flex-col w-full h-fit pb-0 mb-0 mt-0 pt-1.5 bg-white  overflow-hidden transition-all rounded-none duration-300 hover:shadow-lg hover:border-violet-200">
      
      {/* --- IMAGE SECTION --- */}
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden">
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
          className="absolute top-2 left-2 bg-purple-400/90 backdrop-blur-sm text-black border-0"
        >
          {category}
        </Badge>
        
        {hasDiscount && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 bg-red-500 text-white"
          >
            -{discountRate}%
          </Badge>
        )}
      </Link>

      {/* --- CONTENT SECTION --- */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Top-aligned content: Brand, Name, Weight */}
        <div className="space-y-0.5">
          {product.y_weight && (
            <p className="text-xs text-slate-500">{product.y_weight}</p>
          )}
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-slate-800 leading-tight line-clamp-1 hover:text-violet-800 transition-colors">
              {product.pname}
            </h3>
          </Link>
        </div>
        
        {/* Bottom-aligned content: Price and Actions */}
        <div className="mt-auto pt-2">
          {/* Price */}
          <div className="mb-2">
            <div className="flex items-end gap-x-1.5">
              <span className="text-xl font-bold text-violet-900">
                {fcurrency(hasDiscount ? discountedPrice : originalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-red-400 line-through font-semibold">
                  {fcurrency(originalPrice)}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <ProductCardActions product={product} />
        </div>
      </div>
    </Card>
  );
});

export { ProductCard };