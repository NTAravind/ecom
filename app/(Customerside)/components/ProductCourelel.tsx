"use client"

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, PanInfo, useMotionValue, AnimatePresence } from "framer-motion";
import React, { JSX } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductImage {
  url: string;
  alt: string;
  id: number;
}

export interface ProductCarouselProps {
  images: ProductImage[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

const DRAG_BUFFER = 50;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 };

export default function ProductCarousel({
  images,
  baseWidth = 500,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = true,
  loop = true,
  showArrows = true,
  showDots = true,
  className = "",
}: ProductCarouselProps): JSX.Element {
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const x = useMotionValue(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  // Hover handling
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  // Autoplay functionality
  useEffect(() => {
    if (autoplay && images.length > 1 && (!pauseOnHover || !isHovered) && !isDragging) {
      autoplayTimerRef.current = setInterval(goToNext, autoplayDelay);
      return () => {
        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current);
        }
      };
    }
    
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [autoplay, autoplayDelay, isHovered, isDragging, images.length, pauseOnHover, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [goToNext, goToPrevious]);

  // Drag handling
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    setIsDragging(false);
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(offset) < DRAG_BUFFER && Math.abs(velocity) < VELOCITY_THRESHOLD) {
      return;
    }
    
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      goToNext();
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      goToPrevious();
    }
  };

  // Single image case
  if (images.length <= 1) {
    return (
      <div 
        className={`relative border rounded-lg shadow-md overflow-hidden ${className}`}
        style={{ width: `${baseWidth}px`, height: `${baseWidth}px` }}
      >
        <Image
          src={images[0]?.url || "/placeholder.png"}
          alt={images[0]?.alt || "Product Image"}
          fill
          className="object-contain p-4"
          unoptimized
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={{
        width: `${baseWidth}px`,
        height: `${baseWidth}px`,
      }}
      tabIndex={0}
      role="region"
      aria-label="Product image carousel"
    >
      {/* Main carousel container */}
      <motion.div
        className="flex h-full cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ 
          x: -currentIndex * itemWidth,
          transition: SPRING_OPTIONS 
        }}
      >
        {images.map((image, index) => (
          <motion.div
            key={`${image.id}-${index}`}
            className="relative shrink-0 bg-white"
            style={{
              width: itemWidth,
              height: "100%",
            }}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-contain select-none p-4"
              unoptimized
              priority={index === 0}
              draggable={false}
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next image"
            type="button"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white ${
                  currentIndex === index
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to image ${index + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      )}

      {/* Image counter */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-md">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Loading indicator for smooth transitions */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Usage example:
/*
const productImages: ProductImage[] = [
  { id: 1, url: "/product-1.jpg", alt: "Product view 1" },
  { id: 2, url: "/product-2.jpg", alt: "Product view 2" },
  { id: 3, url: "/product-3.jpg", alt: "Product view 3" },
];

<ProductCarousel
  images={productImages}
  baseWidth={600}
  autoplay={true}
  autoplayDelay={4000}
  pauseOnHover={true}
  loop={true}
  showArrows={true}
  showDots={true}
  className="mx-auto"
/>
*/