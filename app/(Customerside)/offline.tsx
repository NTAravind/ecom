import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
// app/offline.tsx (for PWA)
export default function Offline() {
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

      {/* Offline Visual */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gray-300"></div>
        </div>
        <div className="text-6xl md:text-7xl font-bold text-gray-300 mb-4">OFFLINE</div>
      </div>

      {/* Offline Message */}
      <div className="text-center mb-8 max-w-md">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          No Internet Connection
        </h2>
        <p className="text-gray-600 text-lg mb-6">
          Your yarn collection is currently offline. Please check your internet connection and try again.
        </p>
      </div>

      {/* Retry Button */}
      <Button 
        onClick={() => window.location.reload()} 
        size="lg" 
        className="bg-purple-600 hover:bg-purple-700"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again !
      </Button>
    </div>
  )
}