"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import ProductCart from "@/app/store/store";
import { CartAccessory } from "@/app/types/products";

// Reusing types locally to pass the merged data
type DynamicAccessoryData = {
  originalPrice: number
  discountedPrice: number
  stock: number
}
type StaticAccessoryData = {
  id: string
  name: string
  isActive: boolean
  imageUrl: string
  description: string
  category: string
}
type FullAccessoryData = StaticAccessoryData & DynamicAccessoryData

export default function YarnAccessoryBuySection({ prop }: { prop: FullAccessoryData }) {
  const [quantity, setQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  const { AddProduct } = ProductCart();

  // We rely on isActive instead of prop.Shown for accessories
  const isOutOfStock = !prop.isActive || prop.stock === 0;
  const isMaxQuantity = quantity >= prop.stock;

  const handleIncrement = () => {
    if (quantity >= prop.stock) {
      toast?.("Maximum stock reached", {
        description: `Only ${prop.stock} items available in stock.`,
      });
      return;
    }
    setQuantity(q => q + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(q => q - 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    let newQuantity = Math.max(0, parseInt(value, 10) || 0);
    
    // Ensure quantity doesn't exceed stock
    if (newQuantity > prop.stock) {
      newQuantity = prop.stock;
      toast?.("Quantity adjusted", {
        description: `Maximum ${prop.stock} items available.`,
      });
    }
    setQuantity(newQuantity);
  };

  const mockNetworkAction = (callback: () => void) => {
    setTimeout(callback, 600);
  };

  const handleBuyNow = () => {
    if (quantity === 0) {
      toast?.("Select quantity", {
        description: "Please select at least 1 item to purchase.",
      });
      return;
    }
    if (isOutOfStock) {
      toast?.("Out of stock", {
        description: "This item is currently out of stock.",
      });
      return;
    }
    
    setIsLoading(true);
    
    const cartItem: CartAccessory = {
      id: prop.id,
      pname: prop.name,
      irul: prop.imageUrl,
      discountedPrice: prop.discountedPrice,
      originalPrice: prop.originalPrice,
      stock: prop.stock,
      Shown: prop.isActive,
      type: "accessory",
      originalItem: prop as any // Cast is fine since this is mostly for completeness
    };

    mockNetworkAction(() => {
      AddProduct({ item: cartItem, qty: quantity });
      setIsLoading(false);
      window.location.href = '/checkout';
    });
  };

  const handleAddToCart = () => {
    if (quantity === 0) {
      toast?.("Select quantity", {
        description: "Please select at least 1 item to add to cart.",
      });
      return;
    }
    if (isOutOfStock) {
      toast?.("Out of stock", {
        description: "This item is currently out of stock.",
      });
      return;
    }
    
    setIsAddingToCart(true);

    const cartItem: CartAccessory = {
      id: prop.id,
      pname: prop.name,
      irul: prop.imageUrl,
      discountedPrice: prop.discountedPrice,
      originalPrice: prop.originalPrice,
      stock: prop.stock,
      Shown: prop.isActive,
      type: "accessory",
      originalItem: prop as any
    };
    
    mockNetworkAction(() => {
      AddProduct({ item: cartItem, qty: quantity });
      setIsAddingToCart(false);
      setShowSuccess(true);
      toast?.("Added to cart", {
        description: `${quantity} × ${prop.name} added to your cart.`,
      });
      setTimeout(() => setShowSuccess(false), 2000);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        {/* Stock Information */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          {isOutOfStock ? (
            <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
          ) : (
            <Badge variant="secondary" className="text-sm">
              {prop.stock} in stock
            </Badge>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="text-sm sm:text-base font-medium text-gray-900">Quantity</label>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <Button
                  onClick={handleDecrement}
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 sm:h-10 sm:w-10 p-0 rounded-none border-r border-gray-200 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 0 || isOutOfStock}
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease quantity</span>
                </Button>
                
                <div className="relative">
                  <Input
                    type="number"
                    value={quantity}
                    onChange={handleInputChange}
                    min={0}
                    max={prop.stock}
                    disabled={isOutOfStock}
                    className="w-20 sm:w-16 h-12 sm:h-10 text-center text-lg sm:text-base border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold bg-gray-50"
                    aria-label="Accessory quantity"
                  />
                </div>
                
                <Button
                  onClick={handleIncrement}
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 sm:h-10 sm:w-10 p-0 rounded-none border-l border-gray-200 hover:bg-gray-50 transition-colors"
                  disabled={isMaxQuantity || isOutOfStock}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase quantity</span>
                </Button>
              </div>
            </div>

            {/* Total Price Display */}
            {quantity > 0 && (
              <div className="flex-1 text-center sm:text-left">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2">
                  <p className="text-sm font-medium text-green-800">
                    Total: <span className="text-lg sm:text-xl font-bold text-green-600">₹{(prop.discountedPrice * quantity).toLocaleString()}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock || quantity === 0 || isLoading}
          className="w-full sm:flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Processing...
            </>
          ) : (
            <>
              Buy Now 
              {quantity > 0 && <span className="ml-1">({quantity} item{quantity > 1 ? 's' : ''})</span>}
            </>
          )}
        </Button>

        <Button
          onClick={handleAddToCart}
          variant="outline"
          disabled={isOutOfStock || quantity === 0 || isAddingToCart || showSuccess}
          className={`w-full sm:flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold relative overflow-hidden transition-all duration-300 border-2 ${showSuccess ? 'border-green-500 text-green-600 bg-green-50' : 'border-violet-600 text-violet-600 hover:bg-violet-50'}`}
          size="lg"
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            isAddingToCart || showSuccess ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100 relative'
          }`}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </div>
          
          <div className={`flex items-center justify-center transition-all duration-300 ${
            isAddingToCart ? 'scale-100 opacity-100 relative' : 'scale-0 opacity-0 absolute'
          }`}>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            <span>Adding...</span>
          </div>
          
          <div className={`flex items-center justify-center transition-all duration-500 ${
            showSuccess ? 'scale-100 opacity-100 relative' : 'scale-0 opacity-0 absolute'
          }`}>
            <Check className="h-5 w-5 mr-2" />
            <span>Added!</span>
          </div>
        </Button>
      </div>

      {isOutOfStock && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm sm:text-base text-red-800 font-medium">
            This item is currently unavailable. Check back later or contact us for more information.
          </p>
        </div>
      )}

      {!isOutOfStock && prop.stock <= 5 && prop.stock > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm sm:text-base text-orange-800 font-medium">
            ⚠️ Only {prop.stock} items left in stock! Order soon.
          </p>
        </div>
      )}
    </div>
  );
}
