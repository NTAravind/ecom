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

const PRODUCTS_PER_PAGE = 1;

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
    const whereClause: any = { Shown: true };
    
    // Apply filters to where clause for database-level filtering
    if (categories && categories.length > 0) {
      whereClause.category = { in: categories };
    }
    
    if (weights && weights.length > 0) {
      whereClause.y_weight = { in: weights };
    }
    
    if (brands && brands.length > 0) {
      whereClause.brand = { in: brands };
    }
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { pname: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { y_weight: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
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
      where: { Shown: true }
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
      where: { Shown: true },
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
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg aspect-[3/4] w-full"></div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <div className="h-10 w-64 bg-gray-200 animate-pulse rounded"></div>
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
      <div className="mb-4 sm:mb-6 px-1">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">{getResultsTitle()}</h1>
        <p className="text-sm sm:text-base text-gray-600">{getResultsDescription()}</p>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
  const page = parseInt(params.page || "1", 10);
  
  // Ensure page is valid
  const validPage = Math.max(1, page);
  
  const hasFilters =
    (categories && categories.length > 0) || 
    (weights && weights.length > 0) || 
    (brands && brands.length > 0) ||
    (search && search.trim().length > 0);

  return (
    <div className="min-h-screen bg-purple-200">
      {/* Main Container */}
      <div className="max-w-7xl mx-2 px-2 sm:px-3 md:px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <CollapsibleSideMenu />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-4 sm:space-y-6">
              {/* Popular Products Section - Only show when no filters and page 1 */}
              {!hasFilters && validPage === 1 && (
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

              {/* Paginated Products Section */}
              <section className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
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