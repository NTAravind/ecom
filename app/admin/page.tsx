import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { RefreshCw, ShoppingCart, Users, Package, IndianRupee, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react"

import prisma from "@/lib/prisma"
import { fcurrency, fnumber } from "@/utils/utils"
import { revalidatePath } from "next/cache"

// Server Actions
async function refreshDashboard() {
  "use server"
  revalidatePath("/admin")
}

async function getSalesData() {
  const [totalSales, paidOrders, pendingOrders, completedOrders] = await Promise.all([
    prisma.order.aggregate({
      _sum: { pricepaid: true },
      _count: true
    }),
    prisma.order.count({
      where: { paid: true }
    }),
    prisma.order.count({
      where: { paid: false }
    }),
    prisma.order.count({
      where: { complete: true }
    })
  ])

  return {
    totalRevenue: totalSales._sum.pricepaid || 0, // Already in rupees
    totalOrders: totalSales._count,
    paidOrders,
    pendingOrders,
    completedOrders
  }
}

async function getUserData() {
  const totalUsers = await prisma.user.count()
  
  const usersWithOrders = await prisma.user.count({
    where: {
      orders: {
        some: {}
      }
    }
  })

  return {
    totalUsers,
    usersWithOrders
  }
}

async function getProductsData() {
  const [activeProducts, inactiveProducts, lowStockProducts, totalCategories] = await Promise.all([
    prisma.product.count({ where: { Shown: true } }),
    prisma.product.count({ where: { Shown: false } }),
    prisma.product.count({
      where: {
        Shown: true,
        stock: { lte: 10 }
      }
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { Shown: true }
    })
  ])

  const totalStock = await prisma.product.aggregate({
    _sum: { stock: true },
    where: { Shown: true }
  })

  return {
    activeProducts,
    inactiveProducts,
    lowStockProducts,
    totalStock: totalStock._sum.stock || 0,
    totalCategories: totalCategories.length
  }
}

async function getRecentOrders() {
  return await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, phone: true }
      },
      orderItems: {
        select: {
          quantity: true,
          product: {
            select: { pname: true }
          }
        }
      }
    }
  })
}

async function getTopProducts() {
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  })

  const topProducts = await Promise.all(
    topProductsRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { pname: true, brand: true, price: true }
      })
      return {
        name: product?.pname || 'Unknown',
        brand: product?.brand || 'Unknown',
        price: product?.price || 0, // Already in rupees
        totalSold: item._sum.quantity || 0
      }
    })
  )

  return topProducts
}

async function getLowStockProducts() {
  return await prisma.product.findMany({
    where: {
      Shown: true,
      stock: { lte: 10 }
    },
    select: {
      pname: true,
      brand: true,
      stock: true,
      category: true,
      price: true
    },
    orderBy: { stock: 'asc' },
    take: 8
  })
}

export default async function AdminDashboard() {
  const [
    salesData,
    userData,
    productsData,
    recentOrders,
    topProducts,
    lowStockProducts
  ] = await Promise.all([
    getSalesData(),
    getUserData(),
    getProductsData(),
    getRecentOrders(),
    getTopProducts(),
    getLowStockProducts()
  ])

  return (
    <div className="min-h-screen h-screen   w-full">
      <div className="h-full flex flex-col p-2 sm:p-3 lg:p-4 xl:p-6 gap-3 lg:gap-4 xl:gap-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor your e-commerce store performance in real-time
            </p>
          </div>
          <form action={refreshDashboard}>
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </form>
        </div>

        {/* Key Metrics Cards - Updated Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 xl:gap-6 flex-shrink-0">
          <MetricCard
            title="Total Revenue"
            value={fcurrency(salesData.totalRevenue)}
            description={`From ${fnumber(salesData.totalOrders)} orders`}
            icon={<IndianRupee className="h-5 w-5" />}
            trend="+12.5%"
            trendUp={true}
          />
          <MetricCard
            title="Total Orders"
            value={fnumber(salesData.totalOrders)}
            description={`${fnumber(salesData.paidOrders)} paid orders`}
            icon={<ShoppingCart className="h-5 w-5" />}
            trend="+8.2%"
            trendUp={true}
          />
          <MetricCard
            title="Total Users"
            value={fnumber(userData.totalUsers)}
            description={`${fnumber(userData.usersWithOrders)} with orders`}
            icon={<Users className="h-5 w-5" />}
            trend="+5.1%"
            trendUp={true}
          />
          <MetricCard
            title="Active Products"
            value={fnumber(productsData.activeProducts)}
            description={`${fnumber(productsData.totalCategories)} categories`}
            icon={<Package className="h-5 w-5" />}
            trend="+2.3%"
            trendUp={false}
          />
        </div>

        {/* Status Overview - Updated Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 xl:gap-6 flex-shrink-0">
          {/* Order Status */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-sm">Completed</span>
                </div>
                <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 text-xs">
                  {fnumber(salesData.completedOrders)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-sm">Paid</span>
                </div>
                <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 text-xs">
                  {fnumber(salesData.paidOrders)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Pending</span>
                </div>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-xs">
                  {fnumber(salesData.pendingOrders)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="font-medium text-sm">Total Stock</span>
                <span className="text-base sm:text-lg font-bold">{fnumber(productsData.totalStock)}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="font-medium text-sm">Active Products</span>
                <span className="text-base sm:text-lg font-bold">{fnumber(productsData.activeProducts)}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Low Stock</span>
                </div>
                <Badge variant={productsData.lowStockProducts > 0 ? "destructive" : "secondary"} className="text-xs">
                  {fnumber(productsData.lowStockProducts)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Product Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="font-medium text-sm">Total Categories</span>
                <span className="text-base sm:text-lg font-bold">{fnumber(productsData.totalCategories)}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="font-medium text-sm">Inactive Products</span>
                <Badge variant="outline" className="text-xs">{fnumber(productsData.inactiveProducts)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables - Updated Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 lg:gap-4 xl:gap-6 flex-1 min-h-0">
          {/* Recent Orders - Takes up 3 columns on large screens */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm flex flex-col lg:col-span-3">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest orders from customers</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <div className="space-y-2 sm:space-y-3 h-full overflow-y-auto pr-2">
                {recentOrders.map((order, index) => (
                  <div key={order.id} className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold">{order.user.name}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {order.orderItems.length} item(s) • {fcurrency(order.pricepaid)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={order.paid ? "default" : "outline"} className="text-xs">
                          {order.paid ? "Paid" : "Pending"}
                        </Badge>
                        <Badge variant={order.complete ? "default" : "secondary"} className="text-xs">
                          {order.complete ? "Complete" : "Processing"}
                        </Badge>
                      </div>
                    </div>
                    {index < recentOrders.length - 1 && <Separator className="opacity-30" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Top Products & Low Stock - Takes up 2 columns on large screens */}
          <div className="space-y-3 lg:space-y-4 flex flex-col min-h-0 lg:col-span-2">
            {/* Top Products */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm flex flex-col flex-1">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg">Top Selling Products</CardTitle>
                <CardDescription>Best performing products by quantity sold</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <div className="space-y-2 sm:space-y-3 h-full overflow-y-auto">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {product.brand} • {fcurrency(product.price)}
                        </p>
                      </div>
                      <Badge className="bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-800 text-xs">
                        {fnumber(product.totalSold)} sold
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm flex flex-col flex-1">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Products running low (≤10 items)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <div className="space-y-2 sm:space-y-3 h-full overflow-y-auto pr-2">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">No low stock items</p>
                    </div>
                  ) : (
                    lowStockProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="space-y-1">
                          <p className="font-semibold">{product.pname}</p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {product.brand} • {product.category}
                          </p>
                          <p className="text-xs text-slate-500">
                            {fcurrency(product.price)}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs px-2 py-1">
                          {product.stock} left
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

function MetricCard({ title, value, description, icon, trend, trendUp }: MetricCardProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
        <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          {value}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`}>
              <TrendingUp className={`h-3 w-3 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}