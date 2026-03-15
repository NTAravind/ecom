import prisma from "@/lib/prisma";
import { YarnAccessoryCard } from "@/app/components/YarnAccessoryCard";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { YarnAccessoryFilters } from "@/app/components/YarnAccessoryFilters";
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
  search?: string;
  page?: string;
}

const ACCESSORIES_PER_PAGE = 20;

const GetPopularAccessories = unstable_cache(
  async () => {
    const data = await prisma.yarnAccessory.findMany({
      where: { 
        isActive: true,
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
  ['popular-yarn-accessories'],
  {
    revalidate: 86400,
    tags: ['yarn-accessories', 'popular-yarn-accessories']
  }
);

const GetCategories = unstable_cache(
  async () => {
    const categories = await prisma.yarnAccessory.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return categories.map(c => c.category).filter(Boolean).sort();
  },
  ['yarn-accessory-categories'],
  {
    revalidate: 86400,
    tags: ['yarn-accessories', 'yarn-accessory-categories']
  }
);

const GetPaginatedAccessories = unstable_cache(
  async (page: number, filters: {
    categories?: string[];
    search?: string;
  }) => {
    const { categories, search } = filters;
    
    const whereClause: any = { 
      isActive: true,
    };
    
    if (categories && categories.length > 0) {
      whereClause.category = { in: categories };
    }
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    const totalCount = await prisma.yarnAccessory.count({
      where: whereClause
    });

    const accessories = await prisma.yarnAccessory.findMany({
      where: whereClause,
      skip: (page - 1) * ACCESSORIES_PER_PAGE,
      take: ACCESSORIES_PER_PAGE,
      orderBy: { id: 'desc' }
    });

    return {
      accessories,
      totalCount,
      totalPages: Math.ceil(totalCount / ACCESSORIES_PER_PAGE),
      currentPage: page
    };
  },
  ['paginated-yarn-accessories'],
  {
    revalidate: 3600,
    tags: ['yarn-accessories', 'paginated-yarn-accessories']
  }
);

const GetAllAccessoriesCount = unstable_cache(
  async () => {
    const count = await prisma.yarnAccessory.count({
      where: { isActive: true }
    });
    return count;
  },
  ['all-yarn-accessories-count'],
  {
    revalidate: 86400,
    tags: ['yarn-accessories', 'all-yarn-accessories-count']
  }
);

const GetAllAccessoriesPaginated = unstable_cache(
  async (page: number) => {
    const accessories = await prisma.yarnAccessory.findMany({
      where: { isActive: true },
      skip: (page - 1) * ACCESSORIES_PER_PAGE,
      take: ACCESSORIES_PER_PAGE,
      orderBy: { id: 'desc' }
    });
    return accessories;
  },
  ['all-yarn-accessories-paginated'],
  {
    revalidate: 3600,
    tags: ['yarn-accessories', 'all-yarn-accessories-paginated']
  }
);

function AccessoriesPagination({ 
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

function FilteredAccessoriesLoading() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: ACCESSORIES_PER_PAGE }).map((_, i) => (
          <div key={i} className="bg-white/60 animate-pulse rounded-2xl aspect-[3/4] w-full backdrop-blur-sm border border-gray-200/30"></div>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <div className="h-12 w-80 bg-white/60 animate-pulse rounded-xl backdrop-blur-sm"></div>
      </div>
    </div>
  );
}

async function FilteredAccessories({
  categories,
  search,
  page,
  searchParams
}: {
  categories?: string[];
  search?: string;
  page: number;
  searchParams: SearchParams;
}) {
  const hasFilters =
    (categories && categories.length > 0) || 
    (search && search.trim().length > 0);

  let accessories, totalCount, totalPages, currentPage;

  if (!hasFilters) {
    const allAccessoriesCount = await GetAllAccessoriesCount();
    totalPages = Math.ceil(allAccessoriesCount / ACCESSORIES_PER_PAGE);
    currentPage = page;
    accessories = await GetAllAccessoriesPaginated(page);
    totalCount = allAccessoriesCount;
  } else {
    const result = await GetPaginatedAccessories(page, {
      categories,
      search
    });
    
    accessories = result.accessories;
    totalCount = result.totalCount;
    totalPages = result.totalPages;
    currentPage = result.currentPage;
  }

  const getResultsTitle = () => {
    if (search && search.trim()) {
      return `Search Results for "${search}"`;
    }
    return hasFilters ? "Filtered Accessories" : "All Accessories";
  };

  const getResultsDescription = () => {
    let description = `${totalCount} accessory${totalCount !== 1 ? "s" : ""} found`;
    
    if (search && search.trim()) {
      description += ` matching "${search}"`;
    }
    
    if (categories && categories.length > 0) {
      description += ` in categories: ${categories.join(", ")}`;
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

      {accessories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6">
            {accessories.map((accessory) => (
              <YarnAccessoryCard accessory={accessory} key={accessory.id} />
            ))}
          </div>
          
          <AccessoriesPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12 px-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-sm max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">No accessories found</h3>
            <p className="text-gray-600 mb-4">
              {search && search.trim() 
                ? `No accessories match your search for "${search}"`
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

export default async function YarnAccessoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const popularAccessoriesData = await GetPopularAccessories();
  const categoriesData = await GetCategories();

  const params = await searchParams;
  const categories = params.categories?.split(",").filter(Boolean);
  const search = params.search;
  const page = parseInt(params.page || "1", 10);
  
  const validPage = Math.max(1, page);
  
  const hasFilters =
    (categories && categories.length > 0) ||
    (search && search.trim().length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 ">
      <div className="px-1 sm:px-0 lg:px-2 py-6 lg:mx-1">
        <div className="flex flex-col lg:flex-row gap-0">
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <YarnAccessoryFilters categories={categoriesData} />
          </aside>

          <main className="flex-1 ">
            <div className="space-y-8">
              {!hasFilters && validPage === 1 && (
                <section>
                  <div className="mb-6 ">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 px-1">
                      Most Popular Accessories
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 ml-1"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6">
                    {popularAccessoriesData.map((accessory) => (
                      <YarnAccessoryCard accessory={accessory} key={accessory.id} />
                    ))}
                  </div>
                </section>
              )}

              <section >
                <Suspense fallback={<FilteredAccessoriesLoading />}>
                  <FilteredAccessories 
                    categories={categories} 
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
