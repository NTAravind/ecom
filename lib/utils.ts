import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import namer from 'color-namer'
import { Product } from "@/app/generated/prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getColorName(hex: string | undefined): string {
  // Check if hex is undefined or empty
  if (!hex) {
    return 'Unknown Color';
  }
  
  try {
    // Ensure hex starts with # if it doesn't already
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    
    const res = namer(cleanHex);
    return res.basic[0].name;
  } catch (error) {
    console.error('Error getting color name:', error);
    return hex; // Return original hex if there's an error
  }
}

export function CalcWeight(product: Product, qty: number): number {
  return product.weight_g * qty;
}