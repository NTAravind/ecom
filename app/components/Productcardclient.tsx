'use client'
import { useState, useCallback, useMemo, useEffect } from "react";
import { Product } from "../generated/prisma";
import ProductCart from "../store/store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2 } from "lucide-react";

interface ProductCardActionsProps {
  product: Product & {
    stock_quantity?: number;
  };
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { AddProduct, getItemQuantity } = ProductCart();
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Memoize computed values
  const isInCart = useMemo(() => {
    if (!isHydrated) return false;
    return getItemQuantity(product.id) > 0;
  }, [getItemQuantity, product.id, isHydrated]);
  
  const stock = useMemo(() => product.stock_quantity ?? 20, [product.stock_quantity]);
  const isOutOfStock = stock === 0;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding || isOutOfStock) return;
    
    setIsAdding(true);
    AddProduct({ item: product, qty: 1 });
    
    // Optimized timeout handling
    const timer = setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(true);
      
      const successTimer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      
      return () => clearTimeout(successTimer);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [AddProduct, product, isAdding, isOutOfStock]);

  // Early return for out of stock
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

  // Show success state if item was just added
  if (showSuccess || (isHydrated && isInCart)) {
    return (
      <Button
        className="w-full font-semibold text-white rounded-lg h-11 bg-emerald-600 hover:bg-emerald-700 transition-colors"
        size="lg"
        disabled
        aria-label="Added to cart"
      >
        <Check className="w-4 h-4 mr-2" />
        {isInCart ? "In Cart" : "Added!"}
      </Button>
    );
  }

  // Default add to cart button
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