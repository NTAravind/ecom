'use client'
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { YarnAccessoryData } from "./YarnAccessoryCard";

interface YarnAccessoryCardActionsProps {
  accessory: YarnAccessoryData;
}

export function YarnAccessoryCardActions({ accessory }: YarnAccessoryCardActionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isOutOfStock = accessory.stock === 0;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding || isOutOfStock) return;
    
    setIsAdding(true);
    
    const timer = setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(true);
      
      const successTimer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      
      return () => clearTimeout(successTimer);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [accessory, isAdding, isOutOfStock]);

  if (isOutOfStock) {
    return (
      <Button
        className="w-full font-semibold text-white rounded-lg h-11 bg-gray-400 cursor-not-allowed"
        size="lg"
        disabled
        aria-label="Out of stock"
      >
        Out of Stock
      </Button>
    );
  }

  if (showSuccess || isHydrated) {
    return (
      <Button
        className="w-full font-semibold text-white rounded-lg h-11 bg-emerald-600 hover:bg-emerald-700 transition-colors"
        size="lg"
        disabled
        aria-label="Added to cart"
      >
        <Check className="w-4 h-4 mr-2" />
        Added!
      </Button>
    );
  }

  return (
    <Button
      className="w-full font-semibold text-white rounded-sm h-11 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 transition-colors"
      size="lg"
      onClick={handleAddToCart}
      disabled={isAdding}
      aria-label="Add to cart"
    >
      {isAdding ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-2" />
      )}
      <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
    </Button>
  );
}
