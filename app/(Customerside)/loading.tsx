'use client'
export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {/* Logo/Brand Name with Animation */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          <span className="inline-block animate-pulse">PATEL</span>
          <span className="mx-3 text-purple-600">•</span>
          <span className="inline-block animate-pulse animation-delay-300 text-purple-600">YARN</span>
          <span className="mx-3 text-purple-600">•</span>
          <span className="inline-block animate-pulse animation-delay-600">HOUSE</span>
        </h1>
        <p className="text-lg text-gray-600 animate-fade-in">Premium Yarns & Bulk Suppliers</p>
      </div>

      {/* Yarn Ball Animation */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin">
          <div className="w-full h-full rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Yarn Thread */}
        <div className="absolute -right-8 top-1/2 w-12 h-0.5 bg-purple-600 animate-pulse"></div>
        <div className="absolute -right-16 top-1/2 w-4 h-4 rounded-full bg-purple-600 animate-bounce"></div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-gray-600 text-lg mb-2">Loading your yarn collection</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  )
}