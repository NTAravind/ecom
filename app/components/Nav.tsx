"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useState, useEffect } from "react"
import { Menu, X, Search } from "lucide-react"
import ProductCart from "../store/store"
import CartSidebar from "./SideBar"
import { ModernSearchSystem } from "./../(Customerside)/components/searchBar"
import logo from '@/public/logo.jpeg'
import Image from "next/image"
export function NavBar() {
  const pathname = usePathname()
  const [qty, setQty] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { getBasketCount } = ProductCart()

  // Use useEffect to update qty when basket count changes
  useEffect(() => {
    setQty(getBasketCount())
  }, [getBasketCount])

  const navLinkClass = (path: string) =>
    pathname === path
      ? "relative text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-100"
      : "relative text-gray-700 hover:text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"

  const mobileNavLinkClass = (path: string) =>
    pathname === path
      ? "block w-full text-left px-4 py-3 text-purple-600 font-medium border-l-2 border-purple-500 bg-purple-50"
      : "block w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 font-medium hover:bg-gray-50 transition-all duration-200"

  const handleSearch = (query: string) => {
    // Handle search functionality here
    console.log('Search query:', query)
  }

  // Only show search bar on products page
  const showSearchBar = pathname === '/products'

  return (
    <nav className="w-full border-b border-gray-200 bg-white sticky top-0 z-40">
      {/* Main Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-3">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center space-x-6">
            <Image src={logo} alt="Patel Yarn Logo" width={50} height={50} className="hidden lg:block rounded-full" />
            <Link 
              href="/" 
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors duration-300 flex-shrink-0"
            >
              Patel YarnHouse
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex">
              <NavigationMenu>
                <NavigationMenuList className="flex items-center space-x-2">
                  <NavigationMenuItem>
                    <Link href="/" className={navLinkClass("/")}>
                      Home
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/products" className={navLinkClass("/products")}>
                      Products
                    </Link>
                  </NavigationMenuItem>
              
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Center: Search Bar (only on products page - desktop) */}
          {showSearchBar && (
            <div className="hidden lg:flex flex-1 justify-center px-8">
              <div className="w-full max-w-lg">
                <ModernSearchSystem onSearch={handleSearch} />
              </div>
            </div>
          )}

          {/* Right: Search Icon (mobile) + Cart + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Mobile Search Icon (only on products page) */}
            {showSearchBar && (
              <div className="lg:hidden">
                <ModernSearchSystem onSearch={handleSearch} isMobileIcon={true} />
              </div>
            )}

            {/* Desktop/Tablet Cart */}
            <div className="flex items-center space-x-2">
              <CartSidebar />
              {qty > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-500 rounded-full">
                  {qty}
                </span>
              )}
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="py-2">
            <Link 
              href="/" 
              className={mobileNavLinkClass("/")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={mobileNavLinkClass("/products")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
       
          </div>
        </div>
      )}
    </nav>
  )
}