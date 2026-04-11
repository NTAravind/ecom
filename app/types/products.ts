// app/types/product.ts
// Centralized type definitions for products to avoid type mismatches

import { Product, Brand, YarnAccessory } from "../generated/prisma";

/**
 * Basic Brand info (minimal fields needed for most operations)
 */
export type BasicBrand = {
  id: string;
  name: string;
  discountRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  defaultImageUrl: string;
};

/**
 * Product with basic Brand relation
 * Use this for most operations (cart, display, etc.)
 * This is the main type used throughout the application
 */
export type ProductWithBrand = Product & {
  brand: BasicBrand;
};

/**
 * Product with full Brand relation (includes all Brand fields)
 * Use this only when you need ALL brand fields including desc, y_weight, etc.
 */
export type ProductWithFullBrand = Product & {
  brand: Brand;
};

/**
 * Product card data type (uses basic brand info)
 */
export type ProductCardData = ProductWithBrand;

// Note: CartItem is defined in store/store.ts to avoid circular dependencies

/**
 * Static product data (excludes dynamic fields like price and stock)
 * Use this for cached/static queries where price/stock are fetched separately
 */
export type StaticProductData = Omit<Product, 'originalPrice' | 'discountedPrice' | 'stock'> & {
  brand: BasicBrand;
};

/**
 * Dynamic product data (price and stock only)
 * Use this for real-time price/stock queries
 */
export type DynamicProductData = {
  originalPrice: number;
  discountedPrice: number;
  stock: number;
};

/**
 * Full product data (complete product with all fields)
 */
export type FullProductData = ProductWithBrand;

/**
 * Unified types for Global Cart Support
 */
export type CartItemType = 'product' | 'accessory';

// The base shape expected by the cart UI
export interface CartItemBase {
  id: string; // productId or yarnAccessoryId
  pname: string; // mapped from name for accessories
  irul: string; // mapped from imageUrl for accessories
  discountedPrice: number;
  originalPrice: number;
  stock: number;
  Shown: boolean; // mapped from isActive for accessories
  type: CartItemType;
}

export type CartProduct = CartItemBase & { type: 'product', originalItem: ProductWithBrand };
export type CartAccessory = CartItemBase & { type: 'accessory', originalItem: YarnAccessory };

// The item stored inside the zustand CartItem { item: UnifiedCartItem, qty: number }
export type UnifiedCartItem = CartProduct | CartAccessory;

/**
 * Helper function to check if product has discount
 */
export function hasDiscount(product: { originalPrice: number; discountedPrice: number }): boolean {
  return product.originalPrice > product.discountedPrice;
}

/**
 * Helper function to calculate discount percentage
 */
export function getDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Helper function to check stock availability
 */
export function isInStock(product: { stock: number; Shown: boolean }): boolean {
  return product.Shown && product.stock > 0;
}

/**
 * Helper function to check if product is low stock
 */
export function isLowStock(product: { stock: number }, threshold: number = 5): boolean {
  return product.stock > 0 && product.stock <= threshold;
}