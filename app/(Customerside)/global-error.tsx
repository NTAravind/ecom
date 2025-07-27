'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
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

          {/* Error Visual */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8 max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Critical Error
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Something went seriously wrong. Please refresh the page or contact support if the problem persists.
            </p>
          </div>

          {/* Action Button */}
          <Button onClick={reset} size="lg" className="bg-purple-600 hover:bg-purple-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
        </div>
      </body>
    </html>
  )
}
