"use client"; // This directive is often needed for client-side components in Next.js

import { Product } from "@/app/generated/prisma";
import ProductCart, { CartItem } from "@/app/store/store";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui components are in this path
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui components are in this path

export default function BuySection({ prop }: { prop: Product }) {
  // Destructure functions from your Zustand store
  const { AddProduct, RemoveProduct, getItemQuantity, SetItemQuantity } = ProductCart();

  // Local state to manage the quantity displayed in the input field
  // Initialize with the quantity of the current product from the cart, or 0 if not in cart
  const [quantity, setQuantity] = useState<number>(0);

  // Effect to synchronize local quantity state with the global cart state
  // This runs on mount and when `prop.id` or `getItemQuantity` changes,
  // ensuring the counter always reflects the actual cart quantity.
  useEffect(() => {
    setQuantity(getItemQuantity(prop.id));
  }, [prop.id, getItemQuantity]);

  // Handle incrementing the quantity
  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    // Update the cart store
    SetItemQuantity(prop.id, newQuantity);
  };

  // Handle decrementing the quantity
  const handleDecrement = () => {
    if (quantity > 0) { // Prevent quantity from going below zero
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      // Update the cart store
      SetItemQuantity(prop.id, newQuantity);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    const newQuantity = Math.max(0, parseInt(value, 10) || 0); // parseInt can return NaN, so use || 0 as fallback
    setQuantity(newQuantity);
 
    SetItemQuantity(prop.id, newQuantity);
  };

  return (
<>
    <div className="flex gap-2 border-2 p-2 rounded-2xl">

      <Button
        onClick={handleDecrement}
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        disabled={quantity <= 0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
        <span className="sr-only">Decrement quantity</span>
      </Button>

      {/* Quantity Input */}
      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={0}
        className="w-16 text-center appearance-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Product quantity"
      />

      {/* Increment Button */}
      <Button
        onClick={handleIncrement}
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="sr-only">Increment quantity</span>
      </Button>
    
    </div>
    <BuyNowButton prop={{item:prop,qty:quantity}}/>
      <Button onClick={()=>{AddProduct({item:prop,qty:quantity})}}>Add to cart</Button>
</>
  );
}

function BuyNowButton({prop}:{prop:CartItem}){
  return(<>
  <Button>  Buy Now {prop.qty}</Button>

  </>)
}
function AddtoCart({prop}:{prop:CartItem}){
  return(<>

  </>)
}