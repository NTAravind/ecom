// Simplified Modern Search Component - Optimized with Images
'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { getSearchSuggestions } from "../actions/search";
import { useDebounce } from "../hooks/useDebounce";
import Image from "next/image";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  isMobileIcon?: boolean;
}

interface Product {
  id: string;
  pname: string;
  irul: string;
  category?: string;
  brand: {
    id: string;
    name: string;
  };
}

interface SearchSuggestions {
  products: Product[];
  categories: string[];
  brands: { id: string; name: string; }[];
}

// Loading fallback
const SearchFallback = ({ isMobileIcon = false }: { isMobileIcon?: boolean }) => {
  if (isMobileIcon) {
    return (
      <button className="p-2 text-gray-600 border-2 border-black rounded hover:bg-gray-100">
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="relative w-full max-w-lg">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search products..."
        disabled
        className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded bg-gray-50 text-gray-500"
      />
    </div>
  );
};

// Product suggestion item with Next.js Image component
const ProductItem = ({ product, onClick }: { 
  product: Product; 
  onClick: (name: string) => void;
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Check if image URL exists and is valid
  const hasValidImage = product.irul && product.irul.trim() !== '' && !imageError;

  return (
    <button
      onClick={() => onClick(product.pname)}
      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
        {hasValidImage ? (
          <Image
            src={product.irul}
            alt={product.pname}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={handleImageError}
            placeholder="blur"
         unoptimized={false}
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm leading-tight">
          {product.pname}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{product.brand.name}</p>
        {product.category && (
          <p className="text-xs text-gray-400">{product.category}</p>
        )}
      </div>
    </button>
  );
};

// Simple suggestion item for categories and brands
const SuggestionItem = ({ item, onClick, type }: {
  item: string | { name: string };
  onClick: (name: string) => void;
  type?: 'category' | 'brand';
}) => {
  const name = typeof item === 'string' ? item : item.name;
  
  return (
    <button
      onClick={() => onClick(name)}
      className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
    >
      <div className="w-6 h-6 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
        <Search className="h-3 w-3 text-gray-500" />
      </div>
      <span className="truncate">{name}</span>
      {type && (
        <span className="text-xs text-gray-400 ml-auto capitalize">{type}</span>
      )}
    </button>
  );
};

// Main search component
function SearchComponent({ onSearch, isMobileIcon = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    products: [],
    categories: [],
    brands: []
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
    onSearch?.(query);
    setIsOpen(false);
  }, [router, searchParams, onSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push(`?${params.toString()}`);
    onSearch?.('');
  }, [router, searchParams, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions({ products: [], categories: [], brands: [] });
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(debouncedQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions({ products: [], categories: [], brands: [] });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSuggestions();
    }
  }, [debouncedQuery, isOpen]);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mobile icon version
  if (isMobileIcon) {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-600 border-2 border-black rounded hover:bg-gray-100 transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
        
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-3 text-base border-2 border-black rounded focus:border-gray-800"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="p-2 border-2 border-black rounded hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-[calc(100vh-100px)] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900" />
                </div>
              ) : (
                <div className="space-y-6">
                  {suggestions.products.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Products</h3>
                      <div className="space-y-2">
                        {suggestions.products.slice(0, 6).map((product) => (
                          <ProductItem 
                            key={product.id} 
                            product={product} 
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {suggestions.categories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Categories</h3>
                      <div className="space-y-1">
                        {suggestions.categories.slice(0, 4).map((category, index) => (
                          <SuggestionItem 
                            key={index} 
                            item={category} 
                            type="category"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {suggestions.brands.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">Brands</h3>
                      <div className="space-y-1">
                        {suggestions.brands.slice(0, 4).map((brand) => (
                          <SuggestionItem 
                            key={brand.id} 
                            item={brand} 
                            type="brand"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2.5 border-2 border-black rounded focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
        />
        {searchQuery && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 border-2 border-black rounded"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Start typing to search...
            </div>
          ) : (
            <div className="p-3">
              {suggestions.products.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 mb-2">
                    Products
                  </div>
                  <div className="space-y-1">
                    {suggestions.products.slice(0, 5).map((product) => (
                      <ProductItem 
                        key={product.id} 
                        product={product} 
                        onClick={handleSuggestionClick}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {(suggestions.categories.length > 0 || suggestions.brands.length > 0) && (
                <div className="grid grid-cols-1 gap-4">
                  {suggestions.categories.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 mb-2">
                        Categories
                      </div>
                      <div className="space-y-1">
                        {suggestions.categories.slice(0, 3).map((category, index) => (
                          <SuggestionItem 
                            key={index} 
                            item={category} 
                            type="category"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {suggestions.brands.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 mb-2">
                        Brands
                      </div>
                      <div className="space-y-1">
                        {suggestions.brands.slice(0, 3).map((brand) => (
                          <SuggestionItem 
                            key={brand.id} 
                            item={brand} 
                            type="brand"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {suggestions.products.length === 0 && suggestions.categories.length === 0 && suggestions.brands.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No results found for {searchQuery}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main exported component
export function ModernSearchSystem({ onSearch, isMobileIcon = false }: SearchBarProps) {
  return (
    <Suspense fallback={<SearchFallback isMobileIcon={isMobileIcon} />}>
      <SearchComponent onSearch={onSearch} isMobileIcon={isMobileIcon} />
    </Suspense>
  );
}