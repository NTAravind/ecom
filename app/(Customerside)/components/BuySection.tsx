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
    <div className="space-y-4">
      {/* Stock Information */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <Badge variant="destructive">Out of Stock</Badge>
        ) : (
          <Badge variant="secondary" className="text-sm">
            {prop.stock} in stock
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center justify-center w-fit mx-auto sm:mx-0">
          <div className="flex items-center border rounded-lg bg-background overflow-hidden">
            <Button
              onClick={handleDecrement}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-none border-r hover:bg-muted"
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
                className="w-16 h-10 text-center border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                aria-label="Product quantity"
              />
            </div>

            <Button
              onClick={handleIncrement}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-none border-l hover:bg-muted"
              disabled={isMaxQuantity || isOutOfStock}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Increase quantity</span>
            </Button>
          </div>
        </div>
        
        {quantity > 0 && (
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-foreground">
              Total: <span className="text-lg font-semibold text-green-600">₹{(prop.price * quantity).toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock || quantity === 0 || isLoading}
          className="flex-1 h-11"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>Buy Now {quantity > 0 && `(${quantity})`}</>
          )}
        </Button>

        <Button
          onClick={handleAddToCart}
          variant="outline"
          disabled={isOutOfStock || quantity === 0 || isAddingToCart}
          className="flex-1 h-11 relative overflow-hidden transition-all duration-300"
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
        <p className="text-sm text-muted-foreground">
          This item is currently unavailable. Check back later or contact us for more information.
        </p>
      )}
    </div>
  );
}