'use client';

import { useState, useEffect, useRef } from "react";
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

export function EnhancedSearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
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

    fetchSuggestions();
  }, [debouncedSearchQuery]);

  // Update search query from URL
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSuggestions = suggestions.products.length > 0 || 
                       suggestions.categories.length > 0 || 
                       suggestions.weights.length > 0 || 
                       suggestions.brands.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products by name, category, or weight..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (searchQuery.trim().length >= 2 && hasSuggestions) {
              setShowSuggestions(true);
            }
          }}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Search Suggestions Dropdown */}
      {showSuggestions && (searchQuery.trim().length >= 2) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : hasSuggestions ? (
              <div className="space-y-3">
                {/* Product Suggestions */}
                {suggestions.products.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Products</span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSuggestionClick(product.pname, 'product')}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-md flex-shrink-0">
                            {product.iurl1 && (
                              <img 
                                src={product.iurl1} 
                                alt={product.pname}
                                className="w-full h-full object-cover rounded-md"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.pname}
                            </p>
                            <p className="text-xs text-gray-500">₹{product.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Suggestions */}
                {suggestions.categories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Categories</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleSuggestionClick(category, 'category')}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-1 rounded-md transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weight Suggestions */}
                {suggestions.weights.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Weight className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Weights</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.weights.map((weight) => (
                        <button
                          key={weight}
                          onClick={() => handleSuggestionClick(weight, 'weight')}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-800 px-2 py-1 rounded-md transition-colors"
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brand Suggestions */}
                {suggestions.brands.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Brands</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.brands.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => handleSuggestionClick(brand, 'brand')}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 px-2 py-1 rounded-md transition-colors"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                No suggestions found
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {searchQuery && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            Searching for: &ldquo;{searchQuery}&rdquo;
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="ml-1 h-4 w-4 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
}