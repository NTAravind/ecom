// Modern Search Button Component - Wrapped with Suspense
'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { Search, X, Package, Tag, Weight, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { getSearchSuggestions } from "../actions/search";
import { useDebounce } from "../hooks/useDebounce";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  isMobileIcon?: boolean;
}

interface SearchSuggestions {
  products: Array<{
    id: string;
    pname: string;
    price: number;
    iurl1: string;
  }>;
  categories: string[];
  weights: string[];
  brands: string[];
}

// Loading fallback component
function SearchFallback({ isMobileIcon = false }: { isMobileIcon?: boolean }) {
  if (isMobileIcon) {
    return (
      <button className="p-2 text-gray-700 rounded-lg">
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-3 px-4 py-2.5 h-auto min-w-[280px] lg:min-w-[320px] 
                   bg-white border-2 border-black rounded-lg shadow-sm text-left justify-start"
        disabled
      >
        <Search className="h-4 w-4 text-gray-600" />
        <span className="text-gray-700 flex-1 font-medium">Search products...</span>
      </Button>
    </div>
  );
}

// Main search component that uses useSearchParams
function SearchComponent({ onSearch, isMobileIcon = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    products: [],
    categories: [],
    weights: [],
    brands: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    
    router.push(`?${params.toString()}`);
    onSearch?.(query);
    setShowSuggestions(false);
    setIsExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push(`?${params.toString()}`);
    onSearch?.('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const openSearch = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeSearch = () => {
    setIsExpanded(false);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string, type: 'product' | 'category' | 'weight' | 'brand') => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Fetch suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await getSearchSuggestions(debouncedSearchQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions({
          products: [],
          categories: [],
          weights: [],
          brands: []
        });
        setShowSuggestions(false);
      }
    };

    if (isExpanded) {
      fetchSuggestions();
    }
  }, [debouncedSearchQuery, isExpanded]);

  // Update search query from URL
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  const hasSuggestions = suggestions.products.length > 0 || 
                       suggestions.categories.length > 0 || 
                       suggestions.weights.length > 0 || 
                       suggestions.brands.length > 0;

  const currentSearch = searchParams.get('search');

  // If it's mobile icon mode, render the search icon AND the overlay
  if (isMobileIcon) {
    return (
      <>
        <button
          onClick={openSearch}
          className="p-2 text-gray-700 hover:text-purple-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
        >
          <Search className="h-5 w-5" />
        </button>
        
        {/* Mobile Search Overlay */}
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
            <div className="flex items-start justify-center pt-[10vh] px-4">
              <div 
                ref={overlayRef}
                className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border-2 border-black overflow-hidden"
              >
                {/* Search Input */}
                <div className="relative border-b-2 border-black">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search products, categories, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-12 py-5 text-lg bg-transparent border-0 focus-visible:ring-0 
                               placeholder:text-gray-600 focus:outline-none font-medium text-gray-900"
                  />
                  <Button
                    onClick={closeSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 
                               hover:bg-gray-100 rounded-lg border-2 border-black hover:border-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Content */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : searchQuery.trim().length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start typing to search</h3>
                      <p className="text-gray-700">Find products, categories, brands, and more</p>
                      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                        <kbd className="px-2 py-1 bg-gray-100 border-2 border-black rounded text-xs font-medium">↵</kbd>
                        <span>to search</span>
                        <kbd className="px-2 py-1 bg-gray-100 border-2 border-black rounded text-xs font-medium">esc</kbd>
                        <span>to close</span>
                      </div>
                    </div>
                  ) : hasSuggestions ? (
                    <div className="p-6 space-y-6">
                      {/* Product Suggestions */}
                      {suggestions.products.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <Package className="h-5 w-5 text-gray-700" />
                            <span className="font-semibold text-gray-900">Products</span>
                          </div>
                          <div className="space-y-2">
                            {suggestions.products.map((product) => (
                              <button
                                key={product.id}
                                onClick={() => handleSuggestionClick(product.pname, 'product')}
                                className="w-full text-left p-4 hover:bg-gray-50 rounded-lg flex items-center gap-4 
                                           transition-all duration-200 group border-2 border-black hover:border-gray-800"
                              >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border-2 border-black">
                                  {product.iurl1 && (
                                    <img 
                                      src={product.iurl1} 
                                      alt={product.pname}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate group-hover:text-black">
                                    {product.pname}
                                  </p>
                                  <p className="text-gray-700 font-semibold">₹{product.price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Suggestions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {suggestions.categories.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Tag className="h-4 w-4 text-gray-700" />
                              <span className="font-semibold text-gray-900 text-sm">Categories</span>
                            </div>
                            <div className="space-y-1">
                              {suggestions.categories.slice(0, 4).map((category) => (
                                <button
                                  key={category}
                                  onClick={() => handleSuggestionClick(category, 'category')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                             hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {suggestions.weights.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Weight className="h-4 w-4 text-gray-700" />
                              <span className="font-semibold text-gray-900 text-sm">Weights</span>
                            </div>
                            <div className="space-y-1">
                              {suggestions.weights.slice(0, 4).map((weight) => (
                                <button
                                  key={weight}
                                  onClick={() => handleSuggestionClick(weight, 'weight')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                             hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                                >
                                  {weight}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {suggestions.brands.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Building className="h-4 w-4 text-gray-700" />
                              <span className="font-semibold text-gray-900 text-sm">Brands</span>
                            </div>
                            <div className="space-y-1">
                              {suggestions.brands.slice(0, 4).map((brand) => (
                                <button
                                  key={brand}
                                  onClick={() => handleSuggestionClick(brand, 'brand')}
                                  className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                             hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                                >
                                  {brand}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-700 mb-4">
                        Try searching with different keywords or check your spelling
                      </p>
                      <Button 
                        onClick={() => handleSearch(searchQuery)}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg border-2 border-black hover:border-gray-800 font-medium"
                      >
                        Search anyway
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Search Button - Themed with black border for amethyst haze theme */}
      <div className="flex items-center gap-2">
        <Button
          onClick={openSearch}
          variant="outline"
          className="group relative flex items-center gap-3 px-4 py-2.5 h-auto min-w-[280px] lg:min-w-[320px] 
                     bg-white border-2 border-black hover:border-gray-800 rounded-lg shadow-sm 
                     hover:shadow-md transition-all duration-200 text-left justify-start"
        >
          <Search className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
          <span className="text-gray-700 group-hover:text-gray-900 flex-1 font-medium">
            {currentSearch ? `"${currentSearch}"` : "Search products..."}
          </span>
        </Button>

        {currentSearch && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border-2 border-black hover:border-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expanded Search Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="flex items-start justify-center pt-[10vh] px-4">
            <div 
              ref={overlayRef}
              className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border-2 border-black overflow-hidden"
            >
              {/* Search Input */}
              <div className="relative border-b-2 border-black">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, categories, brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-5 text-lg bg-transparent border-0 focus-visible:ring-0 
                             placeholder:text-gray-600 focus:outline-none font-medium text-gray-900"
                />
                <Button
                  onClick={closeSearch}
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 
                             hover:bg-gray-100 rounded-lg border-2 border-black hover:border-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Content */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : searchQuery.trim().length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start typing to search</h3>
                    <p className="text-gray-700">Find products, categories, brands, and more</p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <kbd className="px-2 py-1 bg-gray-100 border-2 border-black rounded text-xs font-medium">↵</kbd>
                      <span>to search</span>
                      <kbd className="px-2 py-1 bg-gray-100 border-2 border-black rounded text-xs font-medium">esc</kbd>
                      <span>to close</span>
                    </div>
                  </div>
                ) : hasSuggestions ? (
                  <div className="p-6 space-y-6">
                    {/* Product Suggestions */}
                    {suggestions.products.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Package className="h-5 w-5 text-gray-700" />
                          <span className="font-semibold text-gray-900">Products</span>
                        </div>
                        <div className="space-y-2">
                          {suggestions.products.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleSuggestionClick(product.pname, 'product')}
                              className="w-full text-left p-4 hover:bg-gray-50 rounded-lg flex items-center gap-4 
                                         transition-all duration-200 group border-2 border-black hover:border-gray-800"
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border-2 border-black">
                                {product.iurl1 && (
                                  <img 
                                    src={product.iurl1} 
                                    alt={product.pname}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate group-hover:text-black">
                                  {product.pname}
                                </p>
                                <p className="text-gray-700 font-semibold">₹{product.price}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {suggestions.categories.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Tag className="h-4 w-4 text-gray-700" />
                            <span className="font-semibold text-gray-900 text-sm">Categories</span>
                          </div>
                          <div className="space-y-1">
                            {suggestions.categories.slice(0, 4).map((category) => (
                              <button
                                key={category}
                                onClick={() => handleSuggestionClick(category, 'category')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                           hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestions.weights.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Weight className="h-4 w-4 text-gray-700" />
                            <span className="font-semibold text-gray-900 text-sm">Weights</span>
                          </div>
                          <div className="space-y-1">
                            {suggestions.weights.slice(0, 4).map((weight) => (
                              <button
                                key={weight}
                                onClick={() => handleSuggestionClick(weight, 'weight')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                           hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                              >
                                {weight}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestions.brands.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Building className="h-4 w-4 text-gray-700" />
                            <span className="font-semibold text-gray-900 text-sm">Brands</span>
                          </div>
                          <div className="space-y-1">
                            {suggestions.brands.slice(0, 4).map((brand) => (
                              <button
                                key={brand}
                                onClick={() => handleSuggestionClick(brand, 'brand')}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 
                                           hover:text-black rounded-lg transition-colors border-2 border-black hover:border-gray-800"
                              >
                                {brand}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-700 mb-4">
                      Try searching with different keywords or check your spelling
                    </p>
                    <Button 
                      onClick={() => handleSearch(searchQuery)}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg border-2 border-black hover:border-gray-800 font-medium"
                    >
                      Search anyway
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Main exported component with Suspense wrapper
export function ModernSearchSystem({ onSearch, isMobileIcon = false }: SearchBarProps) {
  return (
    <Suspense fallback={<SearchFallback isMobileIcon={isMobileIcon} />}>
      <SearchComponent onSearch={onSearch} isMobileIcon={isMobileIcon} />
    </Suspense>
  );
}