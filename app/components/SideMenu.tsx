'use client'

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarSeparator
} from "@/components/ui/sidebar";

const categories = [
  { value: "acrylic", label: "Acrylic - 100%" },
  { value: "acrylic-blend", label: "Acrylic Blend" },
  { value: "bamboo-blend", label: "Bamboo Blend" },
  { value: "cotton", label: "Cotton - 100%" },
  { value: "cotton-blend", label: "Cotton Blend" },
  { value: "mohair-wool-blend", label: "Mohair Wool Blend" },
  { value: "polyester", label: "Polyester - 100%" },
  { value: "wool", label: "Wool - 100%" },
  { value: "wool-blend", label: "Wool Blend" }
];

const weights = [
  { value: "super-fine", label: "Weight 1 – Super Fine" },
  { value: "fine", label: "Weight 2 – Fine" },
  { value: "light-dk", label: "Weight 3 – Light / DK" },
  { value: "medium", label: "Weight 4 – Medium" },
  { value: "bulky", label: "Weight 5 – Bulky" },
  { value: "super-bulky", label: "Weight 6 – Super Bulky" },
  { value: "jumbo", label: "Weight 7 – Jumbo" }
];

export function AppSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Get current filters from URL
  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const selectedWeights = searchParams.get("weights")?.split(",").filter(Boolean) || [];

  const updateFilters = (
    type: 'categories' | 'weights',
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
      router.push(`/products/?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/", { scroll: false });
    });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedWeights.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="my-10">Patel Yarns</SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="my-10 mx-5 space-y-6">
        {hasActiveFilters && (
          <div className="mb-4">
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isPending}
            >
              Clear all filters
            </button>
          </div>
        )}

        <SidebarGroup>
          <h3 className="font-bold mb-2">Category</h3>
          {categories.map((cat) => (
            <label key={cat.value} className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                value={cat.value}
                checked={selectedCategories.includes(cat.value)}
                onChange={() => updateFilters('categories', cat.value, selectedCategories)}
                disabled={isPending}
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </SidebarGroup>

        <SidebarGroup>
          <h3 className="font-bold mb-2">Yarn Weight</h3>
          {weights.map((w) => (
            <label key={w.value} className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                value={w.value}
                checked={selectedWeights.includes(w.value)}
                onChange={() => updateFilters('weights', w.value, selectedWeights)}
                disabled={isPending}
              />
              <span>{w.label}</span>
            </label>
          ))}
        </SidebarGroup>

        {isPending && (
          <div className="text-sm text-gray-500">
            Updating filters...
          </div>
        )}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}