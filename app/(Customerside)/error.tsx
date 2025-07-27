'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          <span>PATEL</span>
          <span className="mx-2 text-purple-600"></span>
          <span className="text-purple-600">YARN</span>
          <span className="mx-2 text-purple-600"></span>
          <span>HOUSE</span>
        </h1>
      </div>

      {/* Error Visual */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200">
            <div className="w-full h-full rounded-full border-4 border-red-500 border-t-transparent"></div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <div className="text-center mb-8 max-w-md">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Something Got Tangled
        </h2>
        <p className="text-gray-600 text-lg mb-6">
          Our yarn seems to have gotten in a knot! Do not worry, we are working to untangle this issue.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={reset} size="lg" className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
