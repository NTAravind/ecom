"use client";

import ProductCart, { CartItem } from "@/app/store/store";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X } from "lucide-react";

export default function CartCard({ prop }: { prop: CartItem }) {
  const { RemoveProduct, SetItemQuantity } = ProductCart();

  // Local state to manage the quantity displayed in the input field for THIS specific cart item
  const [quantity, setQuantity] = useState<number>(prop.qty);

  // Effect to synchronize local quantity state with the global cart state
  useEffect(() => {
    setQuantity(prop.qty);
  }, [prop.qty]);

  // Handle incrementing the quantity
  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    SetItemQuantity(prop.item.id, newQuantity);
  };

  // Handle decrementing the quantity
  const handleDecrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      SetItemQuantity(prop.item.id, newQuantity);
    } else {
      RemoveProduct(prop.item.id);
    }
  };

  // Handle manual input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newQuantity = Math.max(0, parseInt(value, 10) || 0);

    setQuantity(newQuantity);
    if (newQuantity === 0) {
      RemoveProduct(prop.item.id);
    } else {
      SetItemQuantity(prop.item.id, newQuantity);
    }
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-3">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
        {prop.item.irul ? (
          <Image
            src={prop.item.irul}
            alt={prop.item.pname}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {prop.item.pname?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium text-gray-900 truncate">
          {prop.item.pname}
        </h4>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center bg-white rounded-full border border-gray-200 p-1">
        <button
          onClick={handleDecrement}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={quantity <= 0}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </button>

        <span className="text-base font-medium px-4 min-w-[40px] text-center">
          {quantity}
        </span>

        <button
          onClick={handleIncrement}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Price Display */}
      <div className="text-right min-w-[100px]">
        <p className="text-sm text-gray-500">
          ₹{prop.item.price.toFixed(2)} × {quantity}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          ₹{(prop.item.price * quantity).toLocaleString()}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => RemoveProduct(prop.item.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 p-1 ml-2"
        aria-label={`Remove ${prop.item.pname} from cart`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}