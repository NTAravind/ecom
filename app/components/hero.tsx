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
          
          <button className="mt-6 sm:mt-8 px-6 sm:px-8 py-2 sm:py-3 bg-purple-600 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg text-sm sm:text-base">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewArrivals({ products = [] }) {
  const [mounted, setMounted] = useState(false)
  
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
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return (
    <div className="w-full bg-white py-3 sm:py-4 md:py-6 lg:py-8">
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
        
        {/* Scrollable product section - mobile optimized */}
        <div className="w-full lg:flex-1 overflow-hidden">
          {/* Mobile touch-friendly scrolling container */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 animate-scroll-mobile sm:animate-scroll-tablet lg:animate-scroll-desktop hover:animate-pause">
            {/* First set of products - wider mobile cards to prevent content bleeding */}
            {displayProducts.map((item, index) => (
              <div key={`first-${item.id || index}`} className="flex-shrink-0 w-36 xs:w-40 sm:w-44 md:w-48 lg:w-52 xl:w-56">
                <ProductCard product={item} />
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {displayProducts.map((item, index) => (
              <div key={`second-${item.id || index}`} className="flex-shrink-0 w-36 xs:w-40 sm:w-44 md:w-48 lg:w-52 xl:w-56">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced CSS for mobile responsiveness */}
      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Mobile-first animation speeds - adjusted for wider cards */
        .animate-scroll-mobile {
          animation: scroll-infinite 30s linear infinite;
        }
        
        .animate-scroll-tablet {
          animation: scroll-infinite 35s linear infinite;
        }
        
        .animate-scroll-desktop {
          animation: scroll-infinite 40s linear infinite;
        }
        
        .animate-pause {
          animation-play-state: paused;
        }
        
        /* Mobile-specific optimizations - slower for wider cards */
        @media (max-width: 475px) {
          .animate-scroll-mobile {
            animation-duration: 25s;
          }
        }
        
        /* Small mobile devices - ensuring content fits */
        @media (max-width: 320px) {
          .animate-scroll-mobile {
            animation-duration: 22s;
          }
        }
        
        /* Tablet adjustments */
        @media (min-width: 640px) and (max-width: 1023px) {
          .animate-scroll-tablet {
            animation-duration: 30s;
          }
        }
        
        /* Desktop fine-tuning */
        @media (min-width: 1024px) {
          .animate-scroll-desktop {
            animation-duration: 40s;
          }
        }
        
        /* Large desktop */
        @media (min-width: 1280px) {
          .animate-scroll-desktop {
            animation-duration: 45s;
          }
        }
        
        /* Touch device optimization */
        @media (hover: none) and (pointer: coarse) {
          .animate-scroll-mobile,
          .animate-scroll-tablet,
          .animate-scroll-desktop {
            animation-play-state: running;
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-mobile,
          .animate-scroll-tablet,
          .animate-scroll-desktop {
            animation-duration: 60s;
          }
        }
      `}</style>
    </div>
  )
}
interface Category {
  category: string;
  displayName: string;
  image: string;
  sampleProductName: string;
}

interface CategoriesScrollProps {
  categories: Category[];
}

export function CategoriesScroll({ categories }: CategoriesScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const currentScroll = container.scrollLeft;
    const targetScroll = direction === "left" 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth"
    });
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No categories available</p>
      </div>
    );
  }

  return (
    <div className="relative">
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
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <Link
            key={category.category}
            href={`/products?categories=${category.category}`}
            className="flex-shrink-0"
          >
            <Card className="w-48 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer rounded-none">
              <CardContent className="p-4">
                <div className="aspect-square relative mb-3 overflow-hidden rounded-md">
                  <Image
                    src={category.image}
                    alt={category.sampleProductName}
                    fill
                    className="object-cover transition-transform duration-200 hover:scale-110"
                    sizes="350px"
                  />
                </div>
                <h3 className="font-medium text-center text-lg leading-tight ">
                  {category.displayName}
                </h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div> 
  );
}