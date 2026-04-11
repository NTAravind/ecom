'use server';

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Fetch available filter options dynamically from the database
 * Cached permanently until manually revalidated from admin panel
 * 
 * To revalidate from admin panel:
 * import { revalidateTag } from 'next/cache';
 * await revalidateTag('filter-options');
 */
export const getFilterOptions = unstable_cache(
  async () => {
    try {
      const [categories, weights, brands] = await Promise.all([
        // Get unique categories from products
        prisma.product.groupBy({
          by: ['category'],
          where: {
            Shown: true,
            brand: {
              isActive: true
            },
            category: {
              not: null
            }
          },
          _count: {
            category: true
          },
          orderBy: {
            category: 'asc'
          }
        }),
        
        // Get unique weights from products
        prisma.product.groupBy({
          by: ['y_weight'],
          where: {
            Shown: true,
            brand: {
              isActive: true
            },
            y_weight: {
              not: null
            }
          },
          _count: {
            y_weight: true
          },
          orderBy: {
            y_weight: 'asc'
          }
        }),
        
        // Get active brands with product count
        prisma.brand.findMany({
          where: {
            isActive: true,
            products: {
              some: {
                Shown: true
              }
            }
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                products: {
                  where: {
                    Shown: true
                  }
                }
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        })
      ]);

      return {
        categories: categories.map(c => ({
          value: c.category,
          label: c.category,
          count: c._count.category
        })),
        weights: weights.map(w => ({
          value: w.y_weight,
          label: w.y_weight,
          count: w._count.y_weight
        })),
        brands: brands.map(b => ({
          value: b.name,
          label: b.name,
          count: b._count.products
        }))
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        categories: [],
        weights: [],
        brands: []
      };
    }
  },
  ['filter-options'],
  {
    revalidate: false, // Never auto-revalidate
    tags: ['filter-options', 'products', 'brands']
  }
);

/**
 * Get filter counts for current selection
 * Shows how many products match each filter option
 * Cached for 5 minutes to improve performance
 */
export const getFilterCounts = unstable_cache(
  async (currentFilters: {
    categories?: string[];
    weights?: string[];
    brands?: string[];
  }) => {
    try {
      const baseWhere: any = {
        Shown: true,
        brand: {
          isActive: true
        }
      };

      // Apply current filters to base query
      if (currentFilters.categories && currentFilters.categories.length > 0) {
        baseWhere.category = { in: currentFilters.categories };
      }
      if (currentFilters.weights && currentFilters.weights.length > 0) {
        baseWhere.y_weight = { in: currentFilters.weights };
      }
      if (currentFilters.brands && currentFilters.brands.length > 0) {
        baseWhere.brand = {
          ...baseWhere.brand,
          name: { in: currentFilters.brands }
        };
      }

      // Get counts for each filter type
      const [categoryCounts, weightCounts, brandCounts] = await Promise.all([
        prisma.product.groupBy({
          by: ['category'],
          where: baseWhere,
          _count: {
            id: true
          }
        }),
        prisma.product.groupBy({
          by: ['y_weight'],
          where: baseWhere,
          _count: {
            id: true
          }
        }),
        prisma.product.groupBy({
          by: ['brandId'],
          where: baseWhere,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        })
      ]);

      return {
        categories: Object.fromEntries(
          categoryCounts.map(c => [c.category, c._count.id])
        ),
        weights: Object.fromEntries(
          weightCounts.map(w => [w.y_weight, w._count.id])
        ),
        brands: Object.fromEntries(
          brandCounts.map(b => [b.brandId, b._count.id])
        )
      };
    } catch (error) {
      console.error('Error fetching filter counts:', error);
      return {
        categories: {},
        weights: {},
        brands: {}
      };
    }
  },
  ['filter-counts'],
  {
    revalidate: 300, // 5 minutes
    tags: ['filter-counts', 'products']
  }
);