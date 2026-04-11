import React from 'react'
import BrandCard from './brandcard'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { getBrands } from '../_actions/brands'

// Cache the page for 1 hour
export const dynamic = 'force-dynamic'

type BrandWithCount = {
  id: string
  name: string
  discountRate: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    products: number
  }
}

type GetBrandsResult = {
  success: boolean
  data?: BrandWithCount[]
  error?: string
}

const BrandsPage: React.FC = async () => {
  const result: GetBrandsResult = await getBrands()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Brand Management
          </h1>
          <p className="text-gray-600 text-base">
            Manage your brand catalog and discounts
          </p>
        </div>
        
        <Link href="/admin/brands/create" className="shrink-0">
          <Button className="flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Brand
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main>
        {!result.success ? (
          <ErrorState error={result.error} />
        ) : result.data && result.data.length === 0 ? (
          <EmptyState />
        ) : result.data ? (
          <BrandGrid brands={result.data} />
        ) : (
          <ErrorState error="Unknown error occurred" />
        )}
      </main>
    </div>
  )
}

// Error State Component
const ErrorState: React.FC<{ error?: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="text-center max-w-md">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 mb-4">
        {error || 'An unexpected error occurred while loading brands.'}
      </p>
      <Button 
        onClick={() => window.location.reload()} 
        variant="outline"
        className="mt-2"
      >
        Try Again
      </Button>
    </div>
  </div>
)

// Empty State Component
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="text-center max-w-md">
      <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        No brands yet
      </h2>
      <p className="text-gray-600 mb-6">
        Get started by creating your first brand. You can manage products and set discounts for each brand.
      </p>
      <Link href="/admin/brands/new">
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Your First Brand
        </Button>
      </Link>
    </div>
  </div>
)

// Brand Grid Component with wider cards
const BrandGrid: React.FC<{ brands: BrandWithCount[] }> = ({ brands }) => {
  const activeBrands = brands.filter(brand => brand.isActive).length
  const totalProducts = brands.reduce((sum, brand) => sum + brand._count.products, 0)

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{brands.length}</div>
            <div className="ml-2 text-sm text-gray-600">Total Brands</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-600">{activeBrands}</div>
            <div className="ml-2 text-sm text-gray-600">Active Brands</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
            <div className="ml-2 text-sm text-gray-600">Total Products</div>
          </div>
        </div>
      </div>

      {/* Brand Cards Grid - Updated for wider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>

      {/* Footer Info */}
    
    </div>
  )
}

export default BrandsPage