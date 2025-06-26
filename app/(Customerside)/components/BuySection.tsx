"use client";

import { Product } from "@/app/generated/prisma";
import ProductCart, { CartItem } from "@/app/store/store";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner"; // If you're using sonner for toasts

export default function BuySection({ prop }: { prop: Product }) {
  const router = useRouter();
  const { AddProduct, RemoveProduct, getItemQuantity, SetItemQuantity } = ProductCart();

  const [quantity, setQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  useEffect(() => {
    setQuantity(getItemQuantity(prop.id));
  }, [prop.id, getItemQuantity]);

  const handleIncrement = () => {
    if (quantity >= prop.stock) {
      toast?.("Maximum stock reached", {
        description: `Only ${prop.stock} items available in stock.`,
      });
      return;
    }
    
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    SetItemQuantity(prop.id, newQuantity);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      SetItemQuantity(prop.id, newQuantity);
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
    SetItemQuantity(prop.id, newQuantity);
  };

  const handleBuyNow = async () => {
    if (quantity === 0) {
      toast?.("Select quantity", {
        description: "Please select at least 1 item to purchase.",
      });
      return;
    }

    if (!prop.Shown) {
      toast?.("Out of stock", {
        description: "This item is currently out of stock.",
      });
      return;
    }

    setIsLoading(true);
    try {
      AddProduct({ item: prop, qty: quantity });
      router.push('/checkout');
    } catch (error) {
      toast?.("Error", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0) {
      toast?.("Select quantity", {
        description: "Please select at least 1 item to add to cart.",
      });
      return;
    }

    if (!prop.Shown) {
      toast?.("Out of stock", {
        description: "This item is currently out of stock.",
      });
      return;
    }

    setIsAddingToCart(true);
    
    // Add a small delay for better visual feedback
    setTimeout(() => {
      AddProduct({ item: prop, qty: quantity });
      toast?.("Added to cart", {
        description: `${quantity} × ${prop.pname} added to your cart.`,
      });
      setIsAddingToCart(false);
    }, 600);
  };

  const isOutOfStock = !prop.Shown || prop.stock === 0;
  const isMaxQuantity = quantity >= prop.stock;

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
          
          {/* Mobile-First Quantity Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            {/* Quantity Input Section */}
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
                    aria-label="Product quantity"
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
                    Total: <span className="text-lg sm:text-xl font-bold text-green-600">₹{(prop.price * quantity).toLocaleString()}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - Full Width on Mobile */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock || quantity === 0 || isLoading}
          className="w-full sm:flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
          disabled={isOutOfStock || quantity === 0 || isAddingToCart}
          className="w-full sm:flex-1 h-12 sm:h-11 text-base sm:text-sm font-semibold relative overflow-hidden transition-all duration-300 border-2"
          size="lg"
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            isAddingToCart ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </div>
          
          {/* Loading animation */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isAddingToCart ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span>Adding...</span>
            </div>
          </div>
          
          {/* Success checkmark animation */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            isAddingToCart ? 'scale-110 opacity-100' : 'scale-0 opacity-0'
          }`}>
            <div className="animate-pulse">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </Button>
      </div>

      {/* Additional Info */}
      {isOutOfStock && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-sm sm:text-base text-red-800 font-medium">
            This item is currently unavailable. Check back later or contact us for more information.
          </p>
        </div>
      )}
      
      {/* Stock Warning for Low Stock */}
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