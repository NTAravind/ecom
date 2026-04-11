'use client'
import { useState, useCallback, useMemo, useEffect } from "react";
import ProductCart from "../store/store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { ProductCardData, CartProduct } from "@/app/types/products";

interface ProductCardActionsProps {
  product: ProductCardData;
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
  
  // Use stock field directly from product
  const stock = product.stock;
  const isOutOfStock = stock === 0;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding || isOutOfStock) return;
    
    setIsAdding(true);
    
    const cartItem: CartProduct = {
      id: product.id,
      pname: product.pname,
      irul: product.irul,
      discountedPrice: product.discountedPrice,
      originalPrice: product.originalPrice,
      stock: product.stock,
      Shown: product.Shown,
      type: "product",
      originalItem: product
    };
    
    AddProduct({ item: cartItem, qty: 1 });
    
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