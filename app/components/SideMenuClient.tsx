'use client'

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Filter } from "lucide-react";

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type FilterOptions = {
  categories: FilterOption[];
  weights: FilterOption[];
  brands: FilterOption[];
};

type SideMenuClientProps = {
  filterOptions: FilterOptions;
};

export function SideMenuClient({ filterOptions }: SideMenuClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Get current filters from URL
  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const selectedWeights = searchParams.get("weights")?.split(",").filter(Boolean) || [];
  const selectedBrands = searchParams.get("brands")?.split(",").filter(Boolean) || [];

  const updateFilters = (
    type: 'categories' | 'weights' | 'brands',
    value: string,
    currentValues: string[]
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const params = new URLSearchParams(searchParams);
    
    // Reset to page 1 when filters change
    params.delete('page');

    if (newValues.length > 0) {
      params.set(type, newValues.join(","));
    } else {
      params.delete(type);
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('categories');
    params.delete('weights');
    params.delete('brands');
    params.delete('page');
    
    const search = params.get('search');
    
    startTransition(() => {
      router.push(search ? `/products?search=${search}` : "/products", { scroll: false });
    });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedWeights.length > 0 || selectedBrands.length > 0;
  const activeFilterCount = selectedCategories.length + selectedWeights.length + selectedBrands.length;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Filter Button */}
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

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
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
        {/* Mobile Header */}
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

        {/* Desktop Header */}
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

        {/* Filter Content */}
        <div className="p-3 space-y-4">
          {/* Clear Filters Button */}
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

          {/* Brands */}
          {filterOptions.brands.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Brand</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filterOptions.brands.map((brand) => (
                  <label key={brand.value} className="flex items-center justify-between space-x-2 cursor-pointer group">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        value={brand.value}
                        checked={selectedBrands.includes(brand.value)}
                        onChange={() => updateFilters('brands', brand.value, selectedBrands)}
                        disabled={isPending}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        {brand.label}
                      </span>
                    </div>
                    {brand.count !== undefined && (
                      <span className="text-xs text-gray-500">({brand.count})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {filterOptions.categories.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Material</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filterOptions.categories.map((cat) => (
                  <label key={cat.value} className="flex items-center justify-between space-x-2 cursor-pointer group">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        value={cat.value}
                        checked={selectedCategories.includes(cat.value)}
                        onChange={() => updateFilters('categories', cat.value, selectedCategories)}
                        disabled={isPending}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        {cat.label}
                      </span>
                    </div>
                    {cat.count !== undefined && (
                      <span className="text-xs text-gray-500">({cat.count})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Yarn Weight */}
          {filterOptions.weights.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Yarn Weight</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filterOptions.weights.map((w) => (
                  <label key={w.value} className="flex items-center justify-between space-x-2 cursor-pointer group">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        value={w.value}
                        checked={selectedWeights.includes(w.value)}
                        onChange={() => updateFilters('weights', w.value, selectedWeights)}
                        disabled={isPending}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        {w.label}
                      </span>
                    </div>
                    {w.count !== undefined && (
                      <span className="text-xs text-gray-500">({w.count})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filterOptions.brands.length === 0 && 
           filterOptions.categories.length === 0 && 
           filterOptions.weights.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No filters available
            </div>
          )}

          {/* Loading State */}
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