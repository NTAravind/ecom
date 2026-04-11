'use client'

import { useState, useTransition, Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X, Search } from "lucide-react";

interface YarnAccessoryFiltersContentProps {
  categories: string[];
}

function YarnAccessoryFiltersSkeleton() {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="lg:hidden mb-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-200 animate-pulse rounded-lg h-10 w-full"></div>
      </div>
      
      <div className="hidden lg:block bg-white border rounded-sm shadow-sm">
        <div className="p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-20"></div>
        </div>
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 animate-pulse rounded w-16"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function YarnAccessoryFiltersContent({ categories }: YarnAccessoryFiltersContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const selectedCategories = searchParams.get("categories")?.toLowerCase().split(",").filter(Boolean) || [];

  const submitSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const updateFilters = (
    type: 'categories',
    value: string,
    currentValues: string[]
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const params = new URLSearchParams(searchParams);

    if (newValues.length > 0) {
      params.set(type, newValues.join(","));
    } else {
      params.delete(type);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasActiveFilters = selectedCategories.length > 0;
  const activeFilterCount = selectedCategories.length;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="lg:hidden mb-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full justify-center font-medium"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      <div className={`
        fixed lg:relative
        top-0 lg:top-auto
        left-0 lg:left-auto
        h-full lg:h-auto
        w-80 lg:w-64
        bg-white
        border-r lg:border
        lg:rounded-sm
        shadow-lg lg:shadow-sm
        z-50 lg:z-auto
        transform lg:transform-none
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
        pt-0 lg:pt-0
      `}>
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h2 className="font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden lg:block p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <h2 className="font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>

        <div className="p-3 space-y-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(searchValue);
            }} 
            className="mb-4"
          >
            <h3 className="font-semibold mb-2 text-gray-900">Search Products</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search accessories..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                disabled={isPending}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-[10px]" />
            </div>
            {searchValue !== (searchParams.get("search") || "") && (
              <button 
                type="submit"
                className="mt-2 w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded disabled:opacity-50 transition-colors"
                disabled={isPending}
              >
                Apply Search
              </button>
            )}
          </form>

          {hasActiveFilters && (
            <div className="pb-3 border-b">
              <button
                onClick={clearAllFilters}
                className="w-full text-sm text-blue-600 hover:text-blue-800 underline text-left"
                disabled={isPending}
              >
                Clear all filters ({activeFilterCount})
              </button>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Category</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    value={cat}
                    checked={selectedCategories.includes(cat)}
                    onChange={() => updateFilters('categories', cat, selectedCategories)}
                    disabled={isPending}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {isPending && (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Updating filters...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface YarnAccessoryFiltersProps {
  categories: string[];
}

export function YarnAccessoryFilters({ categories }: YarnAccessoryFiltersProps) {
  return (
    <Suspense fallback={<YarnAccessoryFiltersSkeleton />}>
      <YarnAccessoryFiltersContent categories={categories} />
    </Suspense>
  );
}
