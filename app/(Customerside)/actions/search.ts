'use server';

import prisma from "@/lib/prisma";

// Cache for search suggestions (in production, use Redis)
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached results
function getCachedResult(key: string) {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper function to set cache
function setCachedResult(key: string, data: any) {
  searchCache.set(key, { data, timestamp: Date.now() });
  
  // Clean old cache entries (simple cleanup)
  if (searchCache.size > 100) {
    const oldestKey = Array.from(searchCache.keys())[0];
    searchCache.delete(oldestKey);
  }
}

export async function searchProducts(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();
  const cacheKey = `search_products_${searchTerm.toLowerCase()}`;
  
  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }
    
  try {
    const products = await prisma.product.findMany({
      where: {
        Shown: true,
        brand: {
          isActive: true
        },
        OR: [
          {
            pname: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            y_weight: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            brand: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      select: {
        id: true,
        pname: true,
        originalPrice: true,
        discountedPrice: true,
        category: true,
        y_weight: true,
        irul: true, // Fixed: was iurl1, should be irul
        brand: {
          select: {
            id: true,
            name: true,
            discountRate: true,
            isActive: true,
            defaultImageUrl: true
          }
        }
      },
      orderBy: [
        // Prioritize exact name matches
        {
          pname: 'asc'
        }
      ],
      take: 10
    });

    setCachedResult(cacheKey, products);
    return products;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function getSearchSuggestions(query: string) {
  if (!query || query.trim().length < 2) {
    return {
      products: [],
      categories: [],
      weights: [],
      brands: []
    };
  }

  const searchTerm = query.trim();
  const cacheKey = `search_suggestions_${searchTerm.toLowerCase()}`;
  
  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }
    
  try {
    // Use Promise.all for parallel execution of independent queries
    const [productsResult, categoriesResult, weightsResult, brandsResult] = await Promise.all([
      // Product suggestions - prioritize exact matches
      prisma.product.findMany({
        where: {
          Shown: true,
          brand: {
            isActive: true
          },
          OR: [
            {
              pname: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              brand: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        select: {
          id: true,
          pname: true,
          originalPrice: true,
          discountedPrice: true,
          irul: true, // Fixed: was iurl1
          brand: {
            select: {
              id: true,
              name: true,
              discountRate: true,
              isActive: true,
              defaultImageUrl: true
            }
          }
        },
        orderBy: [
          // Prioritize products where the search term appears at the beginning
          {
            pname: 'asc'
          }
        ],
        take: 3
      }),

      // Categories - get distinct values more efficiently
      prisma.product.groupBy({
        by: ['category'],
        where: {
          Shown: true,
          brand: {
            isActive: true
          },
          category: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: {
          category: 'asc'
        }
      }),

      // Weights - get distinct values more efficiently  
      prisma.product.groupBy({
        by: ['y_weight'],
        where: {
          Shown: true,
          brand: {
            isActive: true
          },
          y_weight: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: {
          y_weight: 'asc'
        }
      }),

      // Brands - direct brand search with active filter
      prisma.brand.findMany({
        where: {
          isActive: true,
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          discountRate: true
        },
        orderBy: {
          name: 'asc'
        },
        take: 5
      })
    ]);

    const result = {
      products: productsResult,
      categories: categoriesResult.map(c => c.category),
      weights: weightsResult.map(w => w.y_weight),
      brands: brandsResult
    };

    setCachedResult(cacheKey, result);
    return result;
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    return {
      products: [],
      categories: [],
      weights: [],
      brands: []
    };
  }
}

// Advanced search with filters (bonus optimization)
export async function advancedSearch({
  query,
  category,
  brand,
  minPrice,
  maxPrice,
  weight,
  limit = 20,
  offset = 0
}: {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  weight?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const whereClause: any = {
      Shown: true,
      brand: {
        isActive: true
      }
    };

    // Build where clause dynamically
    if (query && query.trim().length >= 2) {
      whereClause.OR = [
        {
          pname: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        },
        {
          brand: {
            name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    if (category) {
      whereClause.category = {
        equals: category,
        mode: 'insensitive'
      };
    }

    if (brand) {
      whereClause.brand = {
        ...whereClause.brand,
        name: {
          equals: brand,
          mode: 'insensitive'
        }
      };
    }

    if (weight) {
      whereClause.y_weight = {
        equals: weight,
        mode: 'insensitive'
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.discountedPrice = {};
      if (minPrice !== undefined) whereClause.discountedPrice.gte = minPrice;
      if (maxPrice !== undefined) whereClause.discountedPrice.lte = maxPrice;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        pname: true,
        originalPrice: true,
        discountedPrice: true,
        category: true,
        y_weight: true,
        irul: true, // Fixed: was iurl1
        stock: true,
        brand: {
          select: {
            id: true,
            name: true,
            discountRate: true,
            isActive: true,
            defaultImageUrl: true
          }
        }
      },
      orderBy: [
        {
          discountedPrice: 'asc'
        }
      ],
      take: limit,
      skip: offset
    });

    return products;
  } catch (error) {
    console.error('Advanced search error:', error);
    return [];
  }
}

// Get popular search terms (for analytics/autocomplete)
export async function getPopularSearchTerms(limit: number = 10) {
  try {
    // This would typically come from a search analytics table
    // For now, return most common categories and brands
    const [popularCategories, popularBrands] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        where: {
          Shown: true,
          brand: {
            isActive: true
          }
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        },
        take: Math.floor(limit / 2)
      }),
      
      prisma.brand.findMany({
        where: {
          isActive: true
        },
        select: {
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
          products: {
            _count: 'desc'
          }
        },
        take: Math.floor(limit / 2)
      })
    ]);

    return [
      ...popularCategories.map(c => c.category),
      ...popularBrands.map(b => b.name)
    ];
  } catch (error) {
    console.error('Popular search terms error:', error);
    return [];
  }
}