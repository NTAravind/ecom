import prisma from "@/lib/prisma";
import { ProductCard } from "@/app/components/ProductCard";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { CollapsibleSideMenu } from "@/app/components/SideMenu";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis 
} from "@/components/ui/pagination";

interface SearchParams {
  categories?: string;
  weights?: string;
  brands?: string;
  search?: string;
  page?: string;
}

const PRODUCTS_PER_PAGE = 20;

// Cache popular products separately
const GetPopularProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      where: { 
        Shown: true,
        brand: {
          isActive: true
        }
      },
      include: {
        brand: true, // Include brand details (contains category, weight, etc.)
      },
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

// Optimized pagination query - fetch only what we need
const GetPaginatedProducts = unstable_cache(
  async (page: number, filters: {
    categories?: string[];
    weights?: string[];
    brands?: string[];
    search?: string;
  }) => {
    const { categories, weights, brands, search } = filters;
    
    // Build where clause
    const whereClause: any = { 
      Shown: true,
      brand: {
        isActive: true
      }
    };
    
    // Apply filters to brand properties
    if (categories && categories.length > 0) {
      whereClause.brand = {
        ...whereClause.brand,
        category: { in: categories }
      };
    }
    
    if (weights && weights.length > 0) {
      whereClause.brand = {
        ...whereClause.brand,
        y_weight: { in: weights }
      };
    }
    
    if (brands && brands.length > 0) {
      whereClause.brand = {
        ...whereClause.brand,
        name: { in: brands }
      };
    }
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { pname: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { 
            category: { contains: searchTerm, mode: 'insensitive' },
            isActive: true 
          } 
        },
        { brand: { 
            y_weight: { contains: searchTerm, mode: 'insensitive' },
            isActive: true 
          } 
        },
        { brand: { 
            name: { contains: searchTerm, mode: 'insensitive' },
            isActive: true 
          } 
        },
        { desc: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: whereClause
    });

    // Get paginated products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: true, // Include brand details with category, weight, discount rates
      },
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      orderBy: { id: 'desc' } // Consistent ordering
    });

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / PRODUCTS_PER_PAGE),
      currentPage: page
    };
  },
  ['paginated-products'],
  {
    revalidate: 3600, // 1 hour - shorter cache for dynamic content
    tags: ['products', 'paginated-products']
  }
);

// Get all products count for "All Products" section (when no filters)
const GetAllProductsCount = unstable_cache(
  async () => {
    const count = await prisma.product.count({
      where: { 
        Shown: true,
        brand: {
          isActive: true // Only count products from active brands
        }
      }
    });
    return count;
  },
  ['all-products-count'],
  {
    revalidate: 86400, // 24 hours
    tags: ['products', 'all-products-count']
  }
);

// Get paginated all products (when no filters)
const GetAllProductsPaginated = unstable_cache(
  async (page: number) => {
    const products = await prisma.product.findMany({
      where: { 
        Shown: true,
        brand: {
          isActive: true // Only include products from active brands
        }
      },
      include: {
        brand: true, // Include brand details
      },
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      orderBy: { id: 'desc' }
    });
    return products;
  },
  ['all-products-paginated'],
  {
    revalidate: 3600, // 1 hour
    tags: ['products', 'all-products-paginated']
  }
);

// Get active brands for filtering
const GetActiveBrands = unstable_cache(
  async () => {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        discountRate: true,
        category: true,
        y_weight: true
      },
      orderBy: { name: 'asc' }
    });
    return brands;
  },
  ['active-brands'],
  {
    revalidate: 86400, // 24 hours
    tags: ['brands', 'active-brands']
  }
);

// Pagination component with shadcn
function ProductsPagination({ 
  currentPage, 
  totalPages, 
  searchParams 
}: { 
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    if (searchParams.categories) params.set('categories', searchParams.categories);
    if (searchParams.weights) params.set('weights', searchParams.weights);
    if (searchParams.brands) params.set('brands', searchParams.brands);
    if (searchParams.search) params.set('search', searchParams.search);
    if (page > 1) params.set('page', page.toString());
    
    return `?${params.toString()}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="mt-12 flex justify-center">
      <Pagination>
        <PaginationContent className="bg-white/80 backdrop-blur-sm rounded-none border-black border-2 p-2 shadow-sm px-2">
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={createPageUrl(currentPage - 1)} />
            </PaginationItem>
          )}
          
          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink 
                  href={createPageUrl(page as number)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext href={createPageUrl(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function FilteredProductsLoading() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
          <div key={i} className="bg-white/60 animate-pulse rounded-2xl aspect-[3/4] w-full backdrop-blur-sm border border-gray-200/30"></div>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <div className="h-12 w-80 bg-white/60 animate-pulse rounded-xl backdrop-blur-sm"></div>
      </div>
    </div>
  );
}

async function FilteredProducts({
  categories,
  weights,
  brands,
  search,
  page,
  searchParams
}: {
  categories?: string[];
  weights?: string[];
  brands?: string[];
  search?: string;
  page: number;
  searchParams: SearchParams;
}) {
  const hasFilters =
    (categories && categories.length > 0) || 
    (weights && weights.length > 0) || 
    (brands && brands.length > 0) ||
    (search && search.trim().length > 0);

  let products, totalCount, totalPages, currentPage;

  if (!hasFilters) {
    // Get all products with pagination
    const allProductsCount = await GetAllProductsCount();
    totalPages = Math.ceil(allProductsCount / PRODUCTS_PER_PAGE);
    currentPage = page;
    products = await GetAllProductsPaginated(page);
    totalCount = allProductsCount;
  } else {
    // Get filtered products with pagination
    const result = await GetPaginatedProducts(page, {
      categories,
      weights,
      brands,
      search
    });
    
    products = result.products;
    totalCount = result.totalCount;
    totalPages = result.totalPages;
    currentPage = result.currentPage;
  }

  const getResultsTitle = () => {
    if (search && search.trim()) {
      return `Search Results for "${search}"`;
    }
    return hasFilters ? "Filtered Products" : "All Products";
  };

  const getResultsDescription = () => {
    let description = `${totalCount} product${totalCount !== 1 ? "s" : ""} found`;
    
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
    
    if (totalPages > 1) {
      description += ` (Page ${currentPage} of ${totalPages})`;
    }
    
    return description;
  };

  return (
    <div>
      <div className="mb-8 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-800">{getResultsTitle()}</h1>
        <p className="text-sm sm:text-base text-gray-600/80">{getResultsDescription()}</p>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
          
          <ProductsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12 px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-sm max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">No products found</h3>
            <p className="text-gray-600 mb-4">
              {search && search.trim() 
                ? `No products match your search for "${search}"`
                : "Try adjusting your filters to see more results."
              }
            </p>
            {search && search.trim() && (
              <p className="text-sm text-gray-500">
                Try searching with different keywords or check your spelling.
              </p>
            )}
          </div>
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
  const page = parseInt(params.page || "1", 10);
  
  // Ensure page is valid
  const validPage = Math.max(1, page);
  
  const hasFilters =
    (categories && categories.length > 0) || 
    (weights && weights.length > 0) || 
    (brands && brands.length > 0) ||
    (search && search.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 ">
      {/* Main Container */}
      <div className="px-1 sm:px-0 lg:px-2 py-6 lg:mx-1">
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Sidebar */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <CollapsibleSideMenu />
          </aside>

          {/* Main Content */}
          <main className="flex-1 ">
            <div className="space-y-8">
              {/* Popular Products Section - Only show when no filters and page 1 */}
              {!hasFilters && validPage === 1 && (
                <section>
                  <div className="mb-6 ">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 px-1">
                      Most Popular Products
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 ml-1"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6">
                    {popularProductData.map((product) => (
                      <ProductCard product={product} key={product.id} />
                    ))}
                  </div>
                </section>
              )}

              {/* Paginated Products Section */}
              <section >
                <Suspense fallback={<FilteredProductsLoading />}>
                  <FilteredProducts 
                    categories={categories} 
                    weights={weights}
                    brands={brands}
                    search={search}
                    page={validPage}
                    searchParams={params}
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