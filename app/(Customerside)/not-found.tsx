// app/not-found.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          <span>PATEL</span>
          <span className="mx-2 text-purple-600">•</span>
          <span className="text-purple-600">YARN</span>
          <span className="mx-2 text-purple-600">•</span>
          <span>HOUSE</span>
        </h1>
      </div>

      {/* 404 Visual */}
      <div className="text-center mb-8">
        <div className="text-8xl md:text-9xl font-bold text-gray-200 mb-4">404</div>
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-gray-200">
            <div className="w-full h-full rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
          <div className="absolute -right-8 top-1/2 w-16 h-0.5 bg-purple-600"></div>
        </div>
      </div>

      {/* Error Message */}
      <div className="text-center mb-8 max-w-md">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Yarn Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-6">
          Looks like this thread got tangled! The page you are looking for does not exist in our yarn collection.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home !
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">
            <Search className="w-4 h-4 mr-2" />
            Browse Products
          </Link>
        </Button>
      </div>
    </div>
  )
}
