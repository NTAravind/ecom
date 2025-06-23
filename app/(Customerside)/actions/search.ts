'use server';

import prisma from "@/lib/prisma";

export async function searchProducts(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();
  
  try {
    const products = await prisma.product.findMany({
      where: {
        Shown: true,
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
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        pname: true,
        category: true,
        y_weight: true,
        brand: true,
        price: true,
        iurl1: true
      },
      take: 10
    });

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
  
  try {
    // Get unique categories that match the search
    const categories = await prisma.product.findMany({
      where: {
        Shown: true,
        category: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      select: {
        category: true
      },
      distinct: ['category'],
      take: 5
    });

    // Get unique weights that match the search
    const weights = await prisma.product.findMany({
      where: {
        Shown: true,
        y_weight: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      select: {
        y_weight: true
      },
      distinct: ['y_weight'],
      take: 5
    });

    // Get unique brands that match the search
    const brands = await prisma.product.findMany({
      where: {
        Shown: true,
        brand: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      select: {
        brand: true
      },
      distinct: ['brand'],
      take: 5
    });

    // Get product suggestions
    const products = await prisma.product.findMany({
      where: {
        Shown: true,
        pname: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        pname: true,
        price: true,
        iurl1: true
      },
      take: 3
    });

    return {
      products,
      categories: categories.map(c => c.category),
      weights: weights.map(w => w.y_weight),
      brands: brands.map(b => b.brand)
    };
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