import prisma from "@/lib/prisma"
import Hero, { NewArrivals, CategoriesScroll } from "../components/hero"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MessageSquare, DollarSign, Shield } from 'lucide-react'
import { unstable_cache } from "next/cache";
import { ProductCard } from "../components/ProductCard";
import { Button } from "@/components/ui/button";

// Cache popular products (24 hours)
const GetPopularProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      where: { Shown: true },
      include: {
        brand: true,
      },
      orderBy: {
        orderItems: {
          _count: "desc"
        }
      },
      take: 5
    });
    return data;
  },
  ['popular-products'],
  {
    revalidate: 86400, // 24 hours
    tags: ['products', 'popular-products']
  }
);

// Cache new arrivals (6 hours)
const GetNewArrivals = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      orderBy: {
      id:'desc'
      },
      include: { brand: true },
      take: 8,
      where: { Shown: true }
    });
    return data;
  },
  ['new-arrivals'],
  {
    revalidate: 21600, // 6 hours
    tags: ['products', 'new-arrivals']
  }
);

// Cache categories (12 hours - categories don't change often)
const GetAllCategories = unstable_cache(
  async () => {
    console.log("Fetching categories from database...");
    
    const categories = [
      "acrylic",
      "acrylic-blend", 
      "bamboo-blend",
      "cotton",
      "cotton-blend",
      "mohair-wool-blend",
      "polyester",
      "wool",
      "wool-blend"
    ];

    try {
      const categoryData = await Promise.all(
        categories.map(async (category) => {
          try {
            const sampleProduct = await prisma.product.findFirst({
              where: {
                category: category,
                Shown: true,
                stock: {
                  gt: 0
                }
              },
              select: {
                irul: true,
                pname: true
              }
            });

            if (!sampleProduct) {
              console.log(`No products found for category: ${category}`);
              return null;
            }

            return {
              category,
              displayName: getCategoryDisplayName(category),
              image: sampleProduct.irul,
              sampleProductName: sampleProduct.pname
            };
          } catch (categoryError) {
            console.error(`Error fetching category ${category}:`, categoryError);
            return null;
          }
        })
      );

      const validCategories = categoryData.filter(Boolean);
      console.log(`Found ${validCategories.length} valid categories`);
      return validCategories;

    } catch (error) {
      console.error("Error in GetAllCategories:", error);
      // Return empty array instead of throwing to prevent page crash
      return [];
    }
  },
  ['categories-list'],
  {
    revalidate: 43200, // 12 hours
    tags: ['categories', 'products']
  }
);

function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    "acrylic": "Acrylic - 100%",
    "acrylic-blend": "Acrylic Blend",
    "bamboo-blend": "Bamboo Blend",
    "cotton": "Cotton - 100%",
    "cotton-blend": "Cotton Blend",
    "mohair-wool-blend": "Mohair Wool Blend",
    "polyester": "Polyester - 100%",
    "wool": "Wool - 100%",
    "wool-blend": "Wool Blend"
  };

  return displayNames[category] || category;
}

function Mh({ children }: any) {
  return (
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
      {children}
    </h1>
  )
}

// Add revalidation metadata for the entire page
export const revalidate = 3600; // Revalidate page every hour
export const dynamic = 'force-static'; // Force static generation

export default async function Home() {
  try {
    console.log("Starting Home page data fetch...");
    
    // Fetch all data in parallel for better performance
    const [newArrivalsData, categoriesData, popularProductsData] = await Promise.all([
      GetNewArrivals().catch(error => {
        console.error("Error fetching new arrivals:", error);
        return [];
      }),
      GetAllCategories().catch(error => {
        console.error("Error fetching categories:", error);
        return [];
      }),
      GetPopularProducts().catch(error => {
        console.error("Error fetching popular products:", error);
        return [];
      })
    ]);

    console.log("Data fetched successfully:", {
      newArrivals: newArrivalsData.length,
      categories: categoriesData.length,
      popularProducts: popularProductsData.length
    });

    return (
      <>
        <Hero />
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          <NewArri products={newArrivalsData} />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 lg:space-y-16">
            <Disc />
            <CategoriesList categories={categoriesData} />
            <BulkBenefits />
            <GetPopular products={popularProductsData} />
            <Map />
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error("Error in Home component:", error);
    
    // Fallback UI in case of complete failure
    return (
      <>
        <Hero />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading...</h2>
            <p>We are preparing your content. Please refresh if this takes too long.</p>
          </div>
        </div>
      </>
    );
  }
}

// Updated NewArri to accept props instead of fetching data
function NewArri({ products }: { products: any[] }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <NewArrivals products={products} />
    </div>
  )
}

// Static discount section (no caching needed)
function Disc() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="rounded-none p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">10%</h1>
              <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl">OFF</h1>
            </div>
            <div className="text-center sm:text-right">
              <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl">ON ALL</h1>
              <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl">BRANDS</h1>
            </div>
          </div>
        </Card>
        <Card className="rounded-none p-4 sm:p-6 lg:p-8 text-center text-white bg-primary">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold leading-tight">
            FREE DELIVERY
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            2000RS ONWARDS
          </h1>
        </Card>
      </div>
    </section>
  )
}

// Updated CategoriesList to accept props
function CategoriesList({ categories }: { categories: any[] }) {
  return (
    <section className="w-full">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          SHOP BY CATEGORY
        </h2>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">
          Find the perfect yarn for your next project, The perfect Category for you
        </p>
      </div>
      <CategoriesScroll categories={categories} />
    </section>
  );
}

// Static bulk benefits section
function BulkBenefits() {
  return (
    <section className="w-full bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6 items-stretch">
        
        {/* Left Column: Benefits List */}
        <div className="lg:col-span-2 flex flex-col justify-center gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="font-medium leading-relaxed text-sm sm:text-base lg:text-lg">
              Competitive Pricing for<br />Bulk Orders
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="font-medium leading-relaxed text-sm sm:text-base lg:text-lg">
              Quality Assurance for<br />All Products
            </p>
          </div>
        </div>

        {/* Middle Column: Title */}
        <Card className="lg:col-span-3 rounded-none bg-primary">
          <CardContent className="p-6 sm:p-8 lg:p-12 text-center lg:text-right text-white">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight">
              BULK<br />BENEFITS
            </h2>
          </CardContent>
        </Card>

        {/* Right Column: WhatsApp Link */}
        <div className="lg:col-span-1 flex justify-center">
          <Link href={'https://wa.link/stc3xk'} className="w-full">
            <Card className="bg-primary text-white w-full rounded-none h-full min-h-[120px] sm:min-h-[150px] lg:min-h-full">
              <CardContent className="p-0 flex items-center justify-center w-full h-full">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Updated GetPopular to accept props
function GetPopular({ products }: { products: any[] }) {
  return (
    <section className="w-full">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          BEST SELLERS
        </h2>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8">
          Browse our premium yarn collection
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Static map section
 function Map() {
  return (
    <section className="w-full mb-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
        
        {/* Map Card */}
        <Card className="w-full">
          <CardContent className="p-0">
            <div className="relative w-full aspect-square sm:aspect-video lg:aspect-square overflow-hidden">
              {/* Embedded Map */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.061482618031!2d77.57618537418816!3d12.967917614960797!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae17b2a0074205%3A0x70b19767320c085c!2sRoshan%20fancy%20store!5e0!3m2!1sen!2sin!4v1753385080088!5m2!1sen!2sin" 
                width="100%" 
                height="100%"
                className="absolute inset-0 pointer-events-none"
                loading="lazy"
                title="Store Location"
              />
              {/* Clickable Overlay */}
              <a
                href="https://maps.app.goo.gl/aJienJi5AnayPu3m9"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">Open in Google Maps</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="border-l-4 border-primary pl-4 sm:pl-6 lg:pl-8 space-y-4 sm:space-y-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Visit <span className="text-primary">Us</span> at Patel Yarn House
          </h1>
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-700">
            From cotton and acrylic to specialty blends, we offer all types of yarns to suit your every need.
            Whether you are a hobbyist or a wholesaler, our shelves are stocked with vibrant colors and textures.
            Experience warm hospitality and expert guidance to help you find the perfect yarn.
            We welcome bulk orders and ensure the best deals for businesses and creators alike!
          </p>

          <Button asChild size="lg" className="sm:mx-auto">
            <a 
              href="https://maps.app.goo.gl/aJienJi5AnayPu3m9" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Take Us There
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}