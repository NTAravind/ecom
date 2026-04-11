import { Suspense } from "react";
import { getFilterOptions } from "@/lib/actions/filters";
import { SideMenuClient } from "./SideMenuClient";

// Loading component for the sidebar
function SideMenuSkeleton() {
  return (
    <div className="lg:w-64 flex-shrink-0">
      {/* Mobile Filter Button Skeleton */}
      <div className="lg:hidden mb-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-200 animate-pulse rounded-lg h-10 w-full"></div>
      </div>
      
      {/* Desktop Sidebar Skeleton */}
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
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 animate-pulse rounded w-20"></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded flex-1"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 animate-pulse rounded w-16"></div>
            {Array.from({ length: 4 }).map((_, i) => (
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

// Server component that fetches filter options
async function SideMenuServer() {
  const filterOptions = await getFilterOptions();
  
  return <SideMenuClient filterOptions={filterOptions} />;
}

// Main export with Suspense wrapper
export function CollapsibleSideMenu() {
  return (
    <Suspense fallback={<SideMenuSkeleton />}>
      <SideMenuServer />
    </Suspense>
  );
}