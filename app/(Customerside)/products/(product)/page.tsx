import prisma from "@/lib/prisma";
import { ProductCard } from "@/app/components/ProductCard";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { CollapsibleSideMenu } from "@/app/components/SideMenu";


interface SearchParams {
  categories?: string;
  weights?: string;
  brands?: string;
  search?: string;
}

const GetPopularProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      where: { Shown: true },
      orderBy: {
        orderItems: {
          _count: "desc"
        }
      },
      take: 10
    });
    return data;
  },
  ['popular-products'],
  {
    revalidate: 86400, // 24 hours in seconds
    tags: ['products', 'popular-products']
  }
);

const GetProducts = async (filters: {
  categories?: string[];
  weights?: string[];
  brands?: string[];
  search?: string;
}) => {
  const { categories, weights, brands, search } = filters;
  
  // Create a unique cache key based on the filters
  const cacheKey = `products-${(categories || []).sort().join('-')}-${(weights || []).sort().join('-')}-${(brands || []).sort().join('-')}-${search || ''}`;
  
  return unstable_cache(
    async () => {
      const whereClause: any = {
        Shown: true,
        ...(categories && categories.length > 0 && {
          category: { in: categories }
        }),
        ...(weights && weights.length > 0 && {
          y_weight: { in: weights }
        }),
        ...(brands && brands.length > 0 && {
          brand: { in: brands }
        }),
      };

      // Add search functionality
      if (search && search.trim()) {
        const searchTerm = search.trim();
        whereClause.OR = [
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
          },
          {
            desc: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }

      const data = await prisma.product.findMany({
        where: whereClause
      });

      return data;
    },
    [cacheKey],
    {
      revalidate: 86400, // 24 hours in seconds
      tags: ['products', 'filtered-products', 'search-products']
    }
  )();
};

function FilteredProductsLoading() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse rounded-lg aspect-[3/4] w-full"></div>
      ))}
    </div>
  );
}

async function FilteredProducts({
  categories,
  weights,
  brands,
  search,
}: {
  categories?: string[];
  weights?: string[];
  brands?: string[];
  search?: string;
}) {
  const hasFilters =
    (categories && categories.length > 0) || 
    (weights && weights.length > 0) || 
    (brands && brands.length > 0) ||
    (search && search.trim().length > 0);

  if (!hasFilters) {
    const newProductData = await GetProducts({});
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1">All Products</h1>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {newProductData.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    );
  }

  const filteredProducts = await GetProducts({ categories, weights, brands, search });

  const getResultsTitle = () => {
    if (search && search.trim()) {
      return `Search Results for "${search}"`;
    }
    return "Filtered Products";
  };

  const getResultsDescription = () => {
    let description = `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`;
    
    if (search && search.trim()) {
      description += ` matching "${search}"`;
    }
    
    if (brands && brands.length > 0) {
      description += ` from brands: ${brands.join(", ")}`;
    }
    
    if (categories && categories.length > 0) {
      description += ` in categories: ${categories.join(", ")}`;
    }
    
    if (weights && weights.length > 0) {
      description += ` with weights: ${weights.join(", ")}`;
    }
    
    return description;
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6 px-1">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">{getResultsTitle()}</h1>
        <p className="text-sm sm:text-base text-gray-600">{getResultsDescription()}</p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center py-8 sm:py-12 px-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">
            {search && search.trim() 
              ? `No products match your search for "${search}"`
              : "Try adjusting your filters to see more results."
            }
          </p>
          {search && search.trim() && (
            <p className="text-xs sm:text-sm text-gray-400">
              Try searching with different keywords or check your spelling.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const popularProductData = await GetPopularProducts();

  const params = await searchParams;
  const categories = params.categories?.split(",").filter(Boolean);
  const weights = params.weights?.split(",").filter(Boolean);
  const brands = params.brands?.split(",").filter(Boolean);
  const search = params.search;
  
  const hasFilters =
    (categories && categories.length > 0) || 
    (weights && weights.length > 0) || 
    (brands && brands.length > 0) ||
    (search && search.trim().length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-5 px-2 sm:px-3 md:px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <CollapsibleSideMenu />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-4 sm:space-y-6">
              {/* Search Bar */}
             
              {/* Popular Products Section - Only show when no filters */}
              {!hasFilters && (
                <section className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                  <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 px-1">
                    Most Popular Products
                  </h1>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {popularProductData.map((product) => (
                      <ProductCard product={product} key={product.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* Filtered Products Section */}
              <section className={`${hasFilters ? 'bg-white rounded-lg p-4 sm:p-6 shadow-sm' : ''}`}>
                <Suspense fallback={<FilteredProductsLoading />}>
                  <FilteredProducts 
                    categories={categories} 
                    weights={weights}
                    brands={brands}
                    search={search}
                  />
                </Suspense>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}