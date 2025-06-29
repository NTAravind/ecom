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

// Remove the custom Product interface - we'll use the actual Prisma type
// The GetAllProducts function will return the correct type from Prisma

// Cache popular products separately
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
    revalidate: 86400, // 24 hours
    tags: ['products', 'popular-products']
  }
);

// Fetch ALL products once and cache them
const GetAllProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      where: { Shown: true }
    });
    return data;
  },
  ['all-products'],
  {
    revalidate: 86400, // 24 hours
    tags: ['products', 'all-products']
  }
);

// Client-side filtering function - using generic type for flexibility
const filterProducts = <T extends {
  category: string;
  y_weight: string;
  brand: string;
  pname: string;
  desc: string;
}>(
  products: T[],
  filters: {
    categories?: string[];
    weights?: string[];
    brands?: string[];
    search?: string;
  }
): T[] => {
  const { categories, weights, brands, search } = filters;
  
  return products.filter((product) => {
    // Category filter
    if (categories && categories.length > 0) {
      if (!categories.includes(product.category)) return false;
    }
    
    // Weight filter
    if (weights && weights.length > 0) {
      if (!weights.includes(product.y_weight)) return false;
    }
    
    // Brand filter
    if (brands && brands.length > 0) {
      if (!brands.includes(product.brand)) return false;
    }
    
    // Search filter
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const searchableFields = [
        product.pname,
        product.category,
        product.y_weight,
        product.brand,
        product.desc
      ].map(field => field?.toLowerCase() || '');
      
      const matchesSearch = searchableFields.some(field => 
        field.includes(searchTerm)
      );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });
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

  // Fetch all products once
  const allProducts = await GetAllProducts();

  if (!hasFilters) {
    return (
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-1">All Products</h1>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {allProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    );
  }

  // Filter products client-side
  const filteredProducts = filterProducts(allProducts, {
    categories,
    weights,
    brands,
    search
  });

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
    <div className="min-h-screen bg-purple-200">
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