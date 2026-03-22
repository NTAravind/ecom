'use client'
import { Product } from "../generated/prisma";
import { ProductCard } from "./ProductCard";
import { useEffect, useState ,useRef} from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MessageSquare } from 'lucide-react'


export default function Hero() {
  return (
    <div className="relative m-2 sm:m-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 overflow-hidden">
      {/* Background Image Container */}
      <div 
        className="relative bg-[url('/assets/wc.webp')] bg-cover bg-center bg-no-repeat min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
      >
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-20" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-center text-white drop-shadow-2xl max-w-5xl leading-tight">
            Unwind Your{' '}
            <span className="font-extrabold text-accent">Creativity</span>
            <br />
            Premium Yarns for Every{' '}
            <span className="font-extrabold text-accent">Stitch.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 text-center max-w-2xl px-4">
            Discover our curated collection of premium yarns and unleash your creative potential
          </p>
          <Link href={'/products'}>
          <button className="mt-6 sm:mt-8 px-6 sm:px-8 py-2 sm:py-3 bg-purple-600 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg text-sm sm:text-base">
            Shop Now
          </button></Link> 
        </div>
      </div>
    </div>
  );
}

export function NewArrivals({ products = [] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Generate mock products if none provided
  const mockProducts = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    pname: `Yarn Product ${i + 1}`,
    irul: `/placeholder-image-${i + 1}.jpg`,
    originalPrice: Math.floor(Math.random() * 500) + 100,
    discountedPrice: Math.floor(Math.random() * 400) + 80,
    stock: Math.floor(Math.random() * 50) + 1,
    category: 'Yarn',
    y_weight: `${Math.floor(Math.random() * 500) + 50}g`,
    brand: {
      name: `Brand ${i + 1}`,
      discountRate: Math.floor(Math.random() * 30)
    }
  }))

  const displayProducts = products.length > 0 ? products : mockProducts

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [displayProducts]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 300;
    container.scrollTo({
      left: container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full bg-white py-3 sm:py-4 md:py-6 lg:py-8 overflow-hidden">
      {/* Main container with mobile-first responsive layout */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start px-3 sm:px-4 md:px-6 lg:px-10">

        {/* Header section - mobile optimized */}
        <div className="w-full lg:w-auto lg:flex-shrink-0 mb-3 sm:mb-4 lg:mb-0 lg:mr-6 xl:mr-8 text-center lg:text-left">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-black tracking-wide leading-tight">
            LATEST
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-primary">ARRIVALS</span>
          </h2>
        </div>

        {/* Scrollable product section */}
        <div className="w-full lg:flex-1 relative min-w-0 overflow-hidden">
          {/* Left scroll button */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right scroll button */}
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayProducts.map((item, index) => (
              <div key={item.id || index} className="flex-shrink-0 w-36 xs:w-40 sm:w-44 md:w-48 lg:w-52 xl:w-56">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Updated interface for brands
interface Brand {
  id: string;
  name: string;
  discountRate: number;
  productCount: number;
  image: string;
  sampleProductName: string;
}

interface BrandsScrollProps {
  brands: Brand[];
}

// Updated component name and functionality for brands
export function BrandsGrid({ brands }: BrandsScrollProps) {
  if (brands.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No brands available</p>
      </div>
    );
  }

  // Wavy yarn-like pattern background (SVG data URI) - Highly visible!
  const yarnPattern = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.6'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/products?brands=${brand.name}`}
          className="block group h-full"
        >
          <Card 
            className="h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(168,85,247,0.3)] hover:-translate-y-1 border-2 border-purple-200 hover:border-purple-500 cursor-pointer overflow-hidden relative rounded-xl"
          >
            {/* Yarn Pattern Background */}
            <div 
              className="absolute inset-0 z-0 opacity-100 bg-purple-50 transition-opacity duration-500"
              style={yarnPattern}
            />
            
            {/* Decorative Overlay Gradient to keep text readable */}
            <div className="absolute inset-0 bg-white/40 group-hover:bg-white/0 transition-colors duration-300 z-10" />
            
            <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[140px] h-full gap-3 relative z-20">
              <h3 className="font-extrabold text-lg sm:text-xl text-primary drop-shadow-sm group-hover:text-purple-700 transition-colors line-clamp-2">
                {brand.name}
              </h3>
              
              <div className="min-h-[28px] flex items-center justify-center">
                {brand.discountRate > 0 ? (
                  <span className="inline-flex items-center justify-center bg-primary text-white px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-md border border-primary/20">
                    {brand.discountRate}% OFF
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold text-primary/70 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    View Yarn
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export const CategoriesScroll = BrandsGrid;