import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { fcurrency } from "@/utils/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { YarnAccessoryCardActions } from "./YarnAccessoryCardClient";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type YarnAccessoryData = {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  isActive: boolean;
  imageUrl: string;
  description: string;
  category: string;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type YarnAccessoryCardProps = {
  accessory: YarnAccessoryData;
};

const YarnAccessoryCard = memo(function YarnAccessoryCard({ accessory }: YarnAccessoryCardProps) {
  const imageUrl = accessory.imageUrl || '/placeholder-image.jpg';
  const isInStock = accessory.stock > 0;
  
  const originalPrice = accessory.originalPrice;
  const discountedPrice = accessory.discountedPrice;
  const discountPercentage = originalPrice > 0 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) 
    : 0;
  const hasDiscount = discountPercentage > 0;

  return (
    <Card className="group flex flex-col w-full h-fit pb-0 mb-0 mt-0 pt-1.5 bg-white overflow-hidden transition-all rounded-none duration-300 hover:shadow-lg hover:border-violet-200">
      
      {/* --- IMAGE SECTION --- */}
      <Link href={`/yarn-accessories/${accessory.id}`} className="relative block aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={accessory.name || 'Yarn Accessory image'}
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
          {accessory.category}
        </Badge>
        
        {hasDiscount && (
          <Badge
            variant="destructive"
            className="absolute top-2 right-2 bg-red-500 text-white"
          >
            -{discountPercentage}%
          </Badge>
        )}
        
        {!isInStock && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 bg-gray-800/90 backdrop-blur-sm text-white border-0"
          >
            Out of Stock
          </Badge>
        )}
      </Link>

      {/* --- CONTENT SECTION --- */}
      <div className="p-3 flex flex-col flex-grow">
        <div className="space-y-0.5">
          <Link href={`/yarn-accessories/${accessory.id}`}>
            <h3 className="font-semibold text-slate-800 leading-tight line-clamp-2 hover:text-violet-800 transition-colors">
              {accessory.name}
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
          <YarnAccessoryCardActions accessory={accessory} />
        </div>
      </div>
    </Card>
  );
});

export { YarnAccessoryCard };
