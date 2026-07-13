"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useState, useEffect, useCallback, useRef } from "react"
import { Menu, X, Search, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Package } from "lucide-react"
import ProductCart from "../store/store";
import CartSidebar from "../components/SideBar"
import { ModernSearchSystem } from "./../(Customerside)/components/searchBar"
import logo from '@/public/logo.jpg'
import Image from "next/image"

const shopCategories = [
  {
    name: "Acrylic Yarn",
    href: "/products?categories=acrylic",
    subcategories: [
      { name: "Ganga Desire", href: "/products?categories=acrylic&brands=Ganga%20Desire" },
      { name: "Acrylic Hobby India", href: "/products?categories=acrylic&brands=Hobby" },
      { name: "Ganga Spectrum", href: "/products?categories=acrylic&brands=Ganga%20Spectrum" },
       { name: "Olivia", href: "/products?categories=acrylic&brands=Olivia" }
    ]
  },
  {
    name: "Cotton Yarn",
    href: "/products?categories=cotton",
    subcategories: [
      { name: "Ganga Delight Yarn", href: "/products?categories=cotton&brands=Ganga+Delight" },
      { name: "Ganga Summer Bloom", href: "/products?categories=cotton&brands=Ganga%20Summer%20Bloom" },
      { name: "4Ply Cotton", href: "/products?categories=cotton&brands=ply+Cotton" },
      { name: "Picnic Cotton", href: "/products?categories=cotton&brands=Picnic" },
    ]
  },
  {
    name: "polyester Yarn",
    href: "/products?categories=polyster",
    subcategories: [
      { name: "Chenille/Velvet", href: "/products?brands=Gulmarg+Oswal" },
      { name: "Ganga Blanket Yarn", href: "/products?categories=polyster&brands=Ganga" },
      { name: "Super Stitch", href: "/products?&brands=Ganga%20SuperStitch" },
      { name: "plush", href: "/products?categories=polyester&brands=Plush" },
      { name: "Blankie", href: "/products?categories=polyester&brands=Blankie" },
    ]
  },
  {
    name: "Blanket Yarn",
    href: "/products?weights=bulky",
    subcategories: []
  },
  {
    name: "Ganga Super Stitch yarn",
    href: "/products?brands=Ganga+SuperStitch",
    subcategories: []
  },
  {
    name: "Accessories",
    href: "/yarn-accessories",
    subcategories: [
      { name: "Tools", href: "/yarn-accessories?categories=Tools" },
      { name: "Accessories", href: "/yarn-accessories?categories=Accessories" },
      { name: "Amigurumi", href: "/yarn-accessories?categories=Amigurumi" },
    ]
  },
]

export function NavBar() {
  const pathname = usePathname()
  const [qty, setQty] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isShopOpen, setIsShopOpen] = useState(false)
  const [isMobileAccessoriesOpen, setIsMobileAccessoriesOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const { getBasketCount } = ProductCart()
  const shopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const shopDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use Zustand subscribe to reactively update qty when cart state changes
  useEffect(() => {
    setQty(getBasketCount())
    setIsClient(true)

    // Subscribe to Zustand store changes — fires only when state actually changes
    const unsubscribe = ProductCart.subscribe((state) => {
      const count = state.cartItems.reduce((total, cartItem) => total + cartItem.qty, 0)
      setQty(count)
    })

    // Also listen for storage events (cross-tab sync)
    const handleStorageUpdate = () => {
      setQty(getBasketCount())
    }
    window.addEventListener('storage', handleStorageUpdate)

    return () => {
      unsubscribe()
      window.removeEventListener('storage', handleStorageUpdate)
    }
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
    setIsMobileAccessoriesOpen(false)
    setActiveMobileSubmenu(null)
    setIsTransitioning(false)
  }, [])

  useEffect(() => {
    resetMobileMenu()
  }, [pathname, resetMobileMenu])

  // Fixed click outside handler for mobile menu
  useEffect(() => {
    if (!isClient || !isMobileMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Don't close if clicking on the mobile menu button or its children
      if (mobileMenuButtonRef.current && mobileMenuButtonRef.current.contains(target)) {
        return
      }

      // Don't close if clicking inside the mobile menu
      if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
        return
      }

      // Close menu if clicking outside
      resetMobileMenu()
    }

    // Use a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  const navLinkClass = (path: string) =>
    pathname === path
      ? "relative text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-100"
      : "relative text-gray-700 hover:text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"

  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }

  // Fixed toggle function with proper event handling
  const toggleMobileMenu = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    setIsMobileMenuOpen(prev => {
      const newState = !prev
      if (!newState) {
        setIsShopOpen(false)
        setIsMobileAccessoriesOpen(false)
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

  const toggleMobileAccessoriesDropdown = useCallback(() => {
    setIsMobileAccessoriesOpen(prev => !prev)
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
        <div className="flex items-center justify-between min-h-16 py-3">
          {/* Desktop Layout: Logo + Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="flex-shrink-0">
              <Image src={logo} alt="Patel Yarn Logo" width={120} height={80} className="rounded-full" />
            </Link>
            {/* Desktop Navigation - Removed Home link */}
            <div className="flex">
              <NavigationMenu>
                <NavigationMenuList className="flex items-center space-x-2">
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
                    <div className="relative group">
                      <Link 
                        href="/yarn-accessories" 
                        className={`flex items-center space-x-1 ${pathname.startsWith('/yarn-accessories') ? "relative text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-100" : "relative text-gray-700 hover:text-purple-600 font-medium px-4 py-2 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"}`}
                      >
                        <span>Accessories</span>
                        <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                      </Link>
                      
                      {/* Hover Dropdown */}
                      <div className="absolute top-full left-0 pt-2 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[100]">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                          <Link href="/yarn-accessories?categories=Tools" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">Tools</Link>
                          <Link href="/yarn-accessories?categories=Accessories" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">Accessories</Link>
                          <Link href="/yarn-accessories?categories=Amigurumi" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">Amigurumi</Link>
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <Link href="/yarn-accessories" className="block px-4 py-2 text-sm text-purple-600 font-medium hover:bg-purple-50 transition-colors">View All</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/orders" className={navLinkClass("/orders")}>
                      Orders
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/About" className={navLinkClass("/About")}>
                      About
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Mobile Layout: Menu + Logo + Search/Cart */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Left: Mobile Menu Button */}
            <div className="flex items-center">
              <button
                ref={mobileMenuButtonRef}
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

            {/* Center: Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image src={logo} alt="Patel Yarn Logo" width={70} height={70} className="rounded-full" />
            </Link>

            {/* Right: Search Icon (only on products page) + Cart */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search Icon (only on products page) */}
              {showSearchBar && (
                <ModernSearchSystem onSearch={handleSearch} isMobileIcon={true} />
              )}
              {/* Cart */}
              <div className="relative flex items-center">
                <CartSidebar />
                {qty > 0 ? (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-500 rounded-full shadow-sm">
                    {qty > 99 ? '99+' : qty}
                  </span>
                ) : (
                  // Purple dot indicator when cart has items (fallback)
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full opacity-0"></span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Search Bar (only on products page - desktop) */}
          {showSearchBar && (
            <div className="hidden lg:flex flex-1 justify-center px-8 ml-auto mr-auto">
              <div className="w-full max-w-lg">
                <ModernSearchSystem onSearch={handleSearch} />
              </div>
            </div>
          )}

          {/* Right: Cart (desktop only) */}
          <div className="hidden lg:flex items-center space-x-2 ml-auto">
            <div className="relative flex items-center">
              <CartSidebar />
              {qty > 0 ? (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-500 rounded-full shadow-sm">
                  {qty > 99 ? '99+' : qty}
                </span>
              ) : (
                // Purple dot indicator when cart has items (fallback)
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full opacity-0"></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu - Fixed Height with Scrollable Content */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-white z-50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto" ref={mobileMenuRef}>
              <div className="relative min-h-full">
                {/* Main Menu Panel */}
                <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${activeMobileSubmenu ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'} ${isTransitioning ? 'pointer-events-none' : ''}`}>
                  <div className="p-4">
                    {/* Navigation Links - Fixed spacing and added separators */}
                    <div className="space-y-0 mb-6">
                      <Link
                        href="/products"
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors rounded-lg font-medium"
                        onClick={resetMobileMenu}
                      >
                        <ShoppingBag className="w-5 h-5 mr-3 text-gray-400" />
                        <span>Products</span>
                      </Link>

                      <div className="h-px bg-gray-200 mx-4 my-2"></div>

                      <div className="px-2">
                        <button
                          onClick={toggleMobileAccessoriesDropdown}
                          className={`flex items-center justify-between w-full px-2 py-3 text-gray-700 hover:bg-purple-50 active:bg-purple-100 rounded-lg font-medium transition-all duration-200 ${isMobileAccessoriesOpen ? 'bg-purple-50 text-purple-600' : ''}`}
                          aria-expanded={isMobileAccessoriesOpen}
                        >
                          <div className="flex items-center">
                            <Package className="w-5 h-5 mr-3 text-gray-400" />
                            <span>Accessories</span>
                          </div>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileAccessoriesOpen ? 'rotate-180 text-purple-600' : ''}`} />
                        </button>
                        
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileAccessoriesOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="ml-10 space-y-1 py-2">
                            <Link href="/yarn-accessories?categories=Tools" className="block py-2 text-sm text-gray-600 hover:text-purple-600" onClick={resetMobileMenu}>Tools</Link>
                            <Link href="/yarn-accessories?categories=Accessories" className="block py-2 text-sm text-gray-600 hover:text-purple-600" onClick={resetMobileMenu}>Accessories</Link>
                            <Link href="/yarn-accessories?categories=Amigurumi" className="block py-2 text-sm text-gray-600 hover:text-purple-600" onClick={resetMobileMenu}>Amigurumi</Link>
                            <Link href="/yarn-accessories" className="block py-2 text-sm font-medium text-purple-600" onClick={resetMobileMenu}>View All Accessories</Link>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-200 mx-4 my-2"></div>

                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors rounded-lg font-medium"
                        onClick={resetMobileMenu}
                      >
                        <Package className="w-5 h-5 mr-3 text-gray-400" />
                        <span>Orders</span>
                      </Link>

                      <div className="h-px bg-gray-200 mx-4 my-2"></div>

                      <Link
                        href="/About"
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors rounded-lg font-medium"
                        onClick={resetMobileMenu}
                      >
                        <span className="w-5 h-5 mr-3 flex items-center justify-center text-gray-400 font-bold text-sm">i</span>
                        <span>About</span>
                      </Link>
                    </div>

                    <div className="h-px bg-gray-300 mx-2 mb-4"></div>

                    {/* Shop Categories */}
                    <div>
                      <button
                        onClick={toggleShopDropdown}
                        className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-purple-50 active:bg-purple-100 rounded-lg font-medium transition-all duration-200 ${isShopOpen ? 'bg-purple-50 text-purple-600 border border-purple-200' : ''}`}
                        aria-expanded={isShopOpen}
                      >
                        <div className="flex items-center">
                          <ShoppingBag className="w-5 h-5 mr-3 text-gray-400" />
                          <span>Shop Categories</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-all duration-300 ${isShopOpen ? 'rotate-180 text-purple-600' : ''}`} />
                      </button>

                      {/* Shop Categories */}
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isShopOpen ? 'max-h-screen opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        <div className="ml-2 space-y-1 border-l-2 border-purple-200 bg-purple-25 rounded-r-lg p-2">
                          {shopCategories.map((category, index) => (
                            <div
                              key={category.name}
                              className={`transform transition-all duration-300 ${isShopOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
                              style={{ transitionDelay: `${index * 30}ms` }}
                            >
                              {category.subcategories && category.subcategories.length > 0 ? (
                                <button
                                  onClick={() => handleMobileSubmenuOpen(category.name)}
                                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all duration-200 rounded-md hover:bg-purple-50 active:bg-purple-100 group"
                                >
                                  <span className="text-sm">{category.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full group-hover:text-purple-500 group-hover:bg-purple-100">
                                      {category.subcategories.length}
                                    </span>
                                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-all duration-200" />
                                  </div>
                                </button>
                              ) : (
                                <Link
                                  href={category.href}
                                  className="flex items-center justify-between px-3 py-2 text-gray-700 hover:text-purple-600 font-medium transition-all duration-200 rounded-md hover:bg-purple-50 active:bg-purple-100 group"
                                  onClick={resetMobileMenu}
                                >
                                  <span className="text-sm">{category.name}</span>
                                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-all duration-200" />
                                </Link>
                              )}
                              {index < shopCategories.length - 1 && (
                                <div className="h-px bg-purple-100 mx-2 my-1"></div>
                              )}
                            </div>
                          ))}
                          <div className={`border-t border-purple-200 mt-3 pt-3 transform transition-all duration-300 ${isShopOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${shopCategories.length * 30}ms` }}>
                            <Link
                              href="/products"
                              className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 font-medium shadow-sm"
                              onClick={resetMobileMenu}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span className="text-sm">View All Products</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcategory Sliding Panel */}
                <div className={`absolute inset-0 bg-white transition-all duration-300 ease-in-out ${activeMobileSubmenu ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'} ${isTransitioning ? 'pointer-events-none' : ''}`}>
                  {activeMobileSubmenu && (() => {
                    const activeCategory = shopCategories.find(c => c.name === activeMobileSubmenu);
                    if (!activeCategory) return null;
                    return (
                      <div className="p-4">
                        {/* Back Button */}
                        <button
                          onClick={handleMobileSubmenuBack}
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-purple-600 font-medium w-full rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 border-b border-gray-100 mb-4"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          <span>Back to Shop</span>
                        </button>

                        {/* Category Header */}
                        <div className="px-4 py-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                          <h4 className="font-bold text-purple-600">{activeCategory.name}</h4>
                          <p className="text-sm text-purple-500 mt-1">{activeCategory.subcategories?.length} subcategories available</p>
                        </div>

                        {/* Subcategories */}
                        <div className="space-y-1">
                          {activeCategory.subcategories?.map((sub, index) => (
                            <div key={sub.name}>
                              <Link
                                href={sub.href}
                                className="flex items-center justify-between px-4 py-3 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded-lg hover:bg-purple-50 active:bg-purple-100 font-medium group border border-transparent hover:border-purple-200"
                                onClick={resetMobileMenu}
                              >
                                <span className="text-sm">{sub.name}</span>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-all duration-200" />
                              </Link>
                              {index < activeCategory.subcategories!.length - 1 && (
                                <div className="h-px bg-purple-100 mx-4"></div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* View All Button */}
                        <div className="border-t border-gray-200 mt-6 pt-4">
                          <Link
                            href={activeCategory.href}
                            className="block text-center bg-purple-100 text-purple-600 px-4 py-3 rounded-lg hover:bg-purple-200 active:bg-purple-300 transition-all duration-200 font-medium border border-purple-200"
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
        </div>
      )}
    </nav>
  )
}