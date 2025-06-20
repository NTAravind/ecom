"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function NavBar() {
  const pathname = usePathname()

  const navlink = (path: string) =>
    pathname === path
      ? "bg-black text-white rounded-lg px-4 py-2 transition"
      : "text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg px-4 py-2 transition"

  return (
    <nav className="w-full border-b shadow-sm bg-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-black">
          Patel Yarn
        </Link>

        <NavigationMenu>
          <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
              <Link href="/" className={navlink("/")}>Home</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/products" className={navlink("/products")}>Products</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/orders" className={navlink("/orders")}>Orders</Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  )
}
export function Nav() {
  const pathname = usePathname()

  const navlink = (path: string) =>
    pathname === path
      ? "bg-black text-white rounded-lg px-4 py-2 transition"
      : "text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg px-4 py-2 transition"

  return (
    <nav className="w-full border-b bg-gray-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center px-6 py-4">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
              <Link href="/admin" className={navlink("/admin")}>Dashboard</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/admin/products" className={navlink("/admin/products")}>Products</Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/admin/orders" className={navlink("/admin/orders")}>Orders</Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  )
}