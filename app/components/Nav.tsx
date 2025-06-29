"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useState, useEffect, useCallback, useRef } from "react"
import { Menu, X, Search, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react"
import ProductCart from "../store/store"
import CartSidebar from "./SideBar"
import { ModernSearchSystem } from "./../(Customerside)/components/searchBar"
import logo from '@/public/logo.jpg'
import Image from "next/image"

const shopCategories = [
  {
    name: "Acrylic Yarn",
    href: "/products?categories=acrylic",
    subcategories: [
      { name: "Ganga Desire", href: "/products?categories=acrylic&brands=Ganga%20Desire" },
      { name: "Acrylic Bulky", href: "/products?categories=acrylic&weights=bulky" },
    ]
  },
  {
    name: "Cotton Yarn",
    href: "/products?categories=cotton",
    subcategories: [
      { name: "Ganga Cotton Yarn", href: "/products?categories=cotton&brands=Ganga%20Cotton" },
      { name: "Ganga Summer Bloom", href: "/products?categories=cotton&brands=Ganga%20Summer%20Bloom" },
    ]
  },
  {
    name: "Specialty Yarns",
    href: "/products?categories=specialty",
    subcategories: [
      { name: "Chenille/Velvet", href: "/products?categories=polyster%2Cpolyester&brands=Oswal&weights=super-bulky" },
      { name: "Blanket Yarn", href: "/products?categories=polyster%2Cpolyester" },
      { name: "Super Stitch", href: "/products?&brands=Ganga%20SuperStitch" },
     
    ]
  },

  {
    name: "Blanket Yarn",
    href: "/products?categories=polyster&weights=super-bulky",
    subcategories: []
  },
  {
    name: "Chenille / Velvet Yarn by Oswal",
    href: "/products?categories=polyster",
    subcategories: []
  },
  {
    name: "Ganga Super Stitch yarn",
    href: "/products?brands=Ganga+SuperStitch",
    subcategories: []
  },
 
]

export function NavBar() {
  const pathname = usePathname()
  const [qty, setQty] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  
  const { getBasketCount } = ProductCart()
  const shopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const shopDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use useEffect to update qty when basket count changes
  useEffect(() => {
    setQty(getBasketCount())
    setIsClient(true)
  }, [getBasketCount])

  // Scroll effect
  useEffect(() => {
    if (!isClient) return
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isClient])

  const resetMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
    setIsShopOpen(false)
    setActiveMobileSubmenu(null)
    setIsTransitioning(false)
  }, [])

  useEffect(() => { resetMobileMenu() }, [pathname, resetMobileMenu])

  // Click outside handler for mobile menu
  useEffect(() => {
    if (!isClient || !isMobileMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        resetMobileMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen, isClient, resetMobileMenu])

  // Escape key handler
  useEffect(() => {
    if (!isShopOpen && !isMobileMenuOpen) return
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') resetMobileMenu()
    }
    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isShopOpen, isMobileMenuOpen, resetMobileMenu])

  // Cleanup timeouts
  useEffect(() => () => { 
    if (shopDropdownTimeoutRef.current) clearTimeout(shopDropdownTimeoutRef.current)
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
  }, [])

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  const navLinkClass = (path: string) =>
    pathname === path
      ? "relative text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-100"
      : "relative text-gray-700 hover:text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"

  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }

  // Toggle functions
  const toggleMobileMenu = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    setIsMobileMenuOpen(prev => {
      const newState = !prev
      if (!newState) {
        setIsShopOpen(false)
        setActiveMobileSubmenu(null)
        setIsTransitioning(false)
      }
      return newState
    })
  }, [])

  const toggleShopDropdown = useCallback(() => {
    setIsShopOpen(prev => !prev)
    setActiveMobileSubmenu(null)
  }, [])

  // Desktop shop dropdown handlers
  const handleShopMouseEnter = useCallback(() => {
    if (shopDropdownTimeoutRef.current) clearTimeout(shopDropdownTimeoutRef.current)
    setIsShopOpen(true)
  }, [])

  const handleShopMouseLeave = useCallback(() => {
    shopDropdownTimeoutRef.current = setTimeout(() => {
      setIsShopOpen(false)
      setHoveredCategory(null)
    }, 150)
  }, [])

  const closeShopDropdown = useCallback(() => {
    setIsShopOpen(false)
    setHoveredCategory(null)
  }, [])

  // Submenu hover handlers
  const handleSubmenuMouseEnter = useCallback((categoryName: string) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
    setHoveredCategory(categoryName)
  }, [])

  const handleSubmenuMouseLeave = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
    }, 150)
  }, [])

  const handleSubmenuAreaMouseEnter = useCallback(() => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
  }, [])

  // Mobile submenu handlers
  const handleMobileSubmenuOpen = useCallback((categoryName: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveMobileSubmenu(categoryName)
      setIsTransitioning(false)
    }, 150)
  }, [])

  const handleMobileSubmenuBack = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveMobileSubmenu(null)
      setIsTransitioning(false)
    }, 150)
  }, [])

  // Only show search bar on products page
  const showSearchBar = pathname === '/products'

  return (
    <nav className={`w-full border-b bg-white sticky top-0 z-40 transition-all duration-200 ${isScrolled ? 'shadow-md border-gray-200' : 'border-gray-100'}`}>
      {/* Main Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-start min-h-16 py-3">
          {/* Desktop Layout: Logo + Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="flex-shrink-0">
              <Image src={logo} alt="Patel Yarn Logo" width={120} height={60} className="rounded-full" />
            </Link>

            {/* Desktop Navigation */}
            <div className="flex">
              <NavigationMenu>
                <NavigationMenuList className="flex items-center space-x-2">
                  <NavigationMenuItem>
                    <Link href="/" className={navLinkClass("/")}>
                      Home
                    </Link>
                  </NavigationMenuItem>
                  
                  {/* Desktop Shop Dropdown - Fixed positioning */}
                  <NavigationMenuItem>
                    <div className="relative group">
                      <button 
                        className="flex items-center space-x-1 relative text-gray-700 hover:text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300" 
                        aria-expanded={isShopOpen} 
                        aria-haspopup="true" 
                        onMouseEnter={handleShopMouseEnter}
                        onMouseLeave={handleShopMouseLeave}
                        onClick={() => setIsShopOpen(prev => !prev)}
                      >
                        <span>Shop</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isShopOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isShopOpen && (
                        <div 
                          className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] max-h-96 overflow-y-auto" 
                          role="menu"
                          onMouseEnter={handleShopMouseEnter}
                          onMouseLeave={handleShopMouseLeave}
                        >
                          {/* Categories list with hover submenus */}
                          <div className="space-y-1">
                            {shopCategories.map((category) => (
                              <div 
                                key={category.name} 
                                className="relative group/category"
                                onMouseEnter={() => handleSubmenuMouseEnter(category.name)}
                                onMouseLeave={handleSubmenuMouseLeave}
                              >
                                <Link 
                                  href={category.href} 
                                  className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                  onClick={closeShopDropdown}
                                >
                                  <span className="text-sm">{category.name}</span>
                                  {category.subcategories && category.subcategories.length > 0 && (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                </Link>
                                
                                {/* Hover submenu for desktop - Portal-style positioning */}
                                {category.subcategories && 
                                 category.subcategories.length > 0 && 
                                 hoveredCategory === category.name && (
                                  <div 
                                    className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[200] w-64"
                                    style={{
                                      left: '640px', // Adjust this value based on your main dropdown width + gap
                                      top: `${(shopDropdownRef.current?.getBoundingClientRect().top || 0) + window.scrollY + 60}px` // Position relative to main dropdown
                                    }}
                                    onMouseEnter={handleSubmenuAreaMouseEnter}
                                    onMouseLeave={handleSubmenuMouseLeave}
                                  >
                                    <div className="px-4 py-2 border-b border-gray-100">
                                      <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
                                    </div>
                                    <div className="py-1">
                                      {category.subcategories.map((sub) => (
                                        <Link 
                                          key={sub.name} 
                                          href={sub.href} 
                                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors" 
                                          onClick={closeShopDropdown}
                                        >
                                          {sub.name}
                                        </Link>
                                      ))}
                                    </div>
                                    <div className="border-t border-gray-100 mt-1 pt-2">
                                      <Link 
                                        href={category.href} 
                                        className="block mx-2 text-center bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-xs" 
                                        onClick={closeShopDropdown}
                                      >
                                        View All {category.name}
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <Link 
                              href="/products" 
                              className="flex items-center justify-center space-x-2 mx-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm" 
                              onClick={closeShopDropdown}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>View All Products</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
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

          {/* Mobile Layout: Cart + Logo + Search/Menu */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Left: Cart */}
            <div className="flex items-center space-x-2">
              <CartSidebar />
              {qty > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-500 rounded-full">
                  {qty}
                </span>
              )}
            </div>

            {/* Center: Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image src={logo} alt="Patel Yarn Logo" width={50} height={50} className="rounded-full" />
            </Link>

            {/* Right: Search Icon (only on products page) + Mobile Menu */}
            <div className="flex items-center space-x-3">
              {/* Mobile Search Icon (only on products page) */}
              {showSearchBar && (
                <ModernSearchSystem onSearch={handleSearch} isMobileIcon={true} />
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 hover:text-purple-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-md"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                type="button"
              >
                <div className="relative w-6 h-6">
                  <Menu className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`} />
                  <X className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-75'}`} />
                </div>
              </button>
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

          {/* Right: Cart (desktop only) */}
          <div className="hidden lg:flex items-center space-x-2">
            <CartSidebar />
            {qty > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-500 rounded-full">
                {qty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu - Sidebar Style */}
      <div 
        className={`lg:hidden bg-white border-t border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} 
        ref={mobileMenuRef}
      >
        <div className="relative overflow-hidden">
        
          {/* Mobile Navigation - Sidebar Style with Sliding Panels */}
          <div className="px-4 py-4">
            {/* Main Menu Panel */}
            <div className={`transition-all duration-300 ease-in-out ${activeMobileSubmenu ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'} ${isTransitioning ? 'pointer-events-none' : ''}`}>
              {/* Navigation Links */}
              <div className="space-y-1 mb-6">
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded"
                  onClick={resetMobileMenu}
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className="block px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded"
                  onClick={resetMobileMenu}
                >
                  Products
                </Link>
              </div>

              {/* Shop Categories */}
              <div>
                <button 
                  onClick={toggleShopDropdown} 
                  className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded font-medium transition-all duration-200 ${isShopOpen ? 'bg-purple-50 text-purple-600 border border-purple-200' : ''}`} 
                  aria-expanded={isShopOpen}
                >
                  <span>Shop</span>
                  <ChevronDown className={`w-5 h-5 transition-all duration-300 ${isShopOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>
                
                {/* Shop Categories */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isShopOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-2 space-y-2 border-l-2 border-purple-200 bg-purple-25 rounded-r-lg p-3">
                    {shopCategories.map((category, index) => (
                      <div 
                        key={category.name} 
                        className={`transform transition-all duration-300 ${isShopOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`} 
                        style={{ transitionDelay: `${index * 30}ms` }}
                      >
                        {category.subcategories && category.subcategories.length > 0 ? (
                          <button 
                            onClick={() => handleMobileSubmenuOpen(category.name)} 
                            className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:text-purple-600 font-medium text-sm transition-all duration-200 rounded hover:bg-purple-50 active:bg-purple-100 group"
                          >
                            <span>{category.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full group-hover:text-purple-500 group-hover:bg-purple-100">
                                {category.subcategories.length}
                              </span>
                              <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-all duration-200" />
                            </div>
                          </button>
                        ) : (
                          <Link 
                            href={category.href} 
                            className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-purple-600 font-medium text-sm transition-all duration-200 rounded hover:bg-purple-50 active:bg-purple-100 group" 
                            onClick={resetMobileMenu}
                          >
                            <span>{category.name}</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-all duration-200" />
                          </Link>
                        )}
                      </div>
                    ))}
                    <div className={`border-t border-purple-200 mt-4 pt-4 transform transition-all duration-300 ${isShopOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${shopCategories.length * 30}ms` }}>
                      <Link 
                        href="/products" 
                        className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 text-sm font-medium shadow-sm" 
                        onClick={resetMobileMenu}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>View All Products</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subcategory Sliding Panel */}
            <div className={`absolute top-0 left-0 w-full px-4 py-4 bg-white transition-all duration-300 ease-in-out ${activeMobileSubmenu ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'} ${isTransitioning ? 'pointer-events-none' : ''}`}>
              {activeMobileSubmenu && (() => {
                const activeCategory = shopCategories.find(c => c.name === activeMobileSubmenu);
                if (!activeCategory) return null;
                return (
                  <div className="space-y-2">
                    {/* Back Button */}
                    <button 
                      onClick={handleMobileSubmenuBack} 
                      className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:text-purple-600 font-medium w-full rounded hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 border-b border-gray-100 mb-3"
                    >
                      <ChevronLeft className="w-6 h-6" />
                      <span>Back to Shop</span>
                    </button>
                    
                    {/* Category Header */}
                    <div className="px-4 py-4 bg-purple-50 rounded border border-purple-200 mb-4">
                      <h4 className="font-bold text-purple-600">{activeCategory.name}</h4>
                      <p className="text-sm text-purple-500 mt-1">{activeCategory.subcategories?.length} subcategories available</p>
                    </div>
                    
                    {/* Subcategories */}
                    {activeCategory.subcategories?.map((sub, index) => (
                      <Link 
                        key={sub.name} 
                        href={sub.href} 
                        className="flex items-center justify-between px-4 py-4 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded hover:bg-purple-50 active:bg-purple-100 text-sm font-medium group border border-transparent hover:border-purple-200"
                        onClick={resetMobileMenu}
                      >
                        <span>{sub.name}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-all duration-200" />
                      </Link>
                    ))}
                    
                    {/* View All Button */}
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <Link 
                        href={activeCategory.href} 
                        className="block text-center bg-purple-100 text-purple-600 px-4 py-4 rounded hover:bg-purple-200 active:bg-purple-300 transition-all duration-200 text-sm font-medium border border-purple-200" 
                        onClick={resetMobileMenu}
                      >
                        View All {activeCategory.name}
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}