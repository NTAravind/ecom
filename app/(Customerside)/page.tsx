import prisma from "@/lib/prisma"
import Hero, { NewArrivals, BrandsScroll } from "../components/hero"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MessageSquare, DollarSign, Shield } from 'lucide-react'
import { unstable_cache } from "next/cache";
import { ProductCard } from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { Metadata } from 'next';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Patel Yarn House - Premium Yarns & Bulk Yarn Suppliers in Bangalore',
  description: 'Shop premium quality yarns at Patel Yarn House, Bangalore. Wide range of cotton, acrylic, wool yarns from top brands. Bulk orders welcome with competitive pricing and free delivery above ₹2000.',
  keywords: 'yarn shop bangalore, bulk yarn suppliers, cotton yarn, acrylic yarn, wool yarn, yarn wholesaler, knitting yarn, crochet yarn, premium yarn brands',
  openGraph: {
    title: 'Patel Yarn House - Premium Yarns & Bulk Yarn Suppliers',
    description: 'Discover quality yarns from trusted brands. Competitive bulk pricing, expert guidance, and free delivery above ₹2000. Visit our Bangalore store today!',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Patel Yarn House',
    images: [
      {
        url: 'https://www.instagram.com/patelyarnhouse/', // Add your store image
        width: 1200,
        height: 630,
        alt: 'Patel Yarn House - Premium Yarn Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Patel Yarn House - Premium Yarns & Bulk Suppliers',
    description: 'Quality yarns from trusted brands. Bulk orders welcome with competitive pricing.',
    images: ['https://www.instagram.com/patelyarnhouse/'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://patelyarnhouse.com', // Replace with your actual domain
  },
};

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
        id: 'desc'
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

// Cache brands (12 hours - brands don't change often)
const GetAllBrands = unstable_cache(
  async () => {
    console.log("Fetching brands from database...");

    try {
      const brands = await prisma.brand.findMany({
        where: {
          isActive: true,
          products: {
            some: {
              Shown: true,
              stock: {
                gt: 0
              }
            }
          }
        },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  Shown: true,
                  stock: {
                    gt: 0
                  }
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get a sample product image for each brand
      const brandsWithImages = await Promise.all(
        brands.map(async (brand) => {
          try {
            const sampleProduct = await prisma.product.findFirst({
              where: {
                brandId: brand.id,
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

            return {
              id: brand.id,
              name: brand.name,
              discountRate: brand.discountRate,
              productCount: brand._count.products,
              image: sampleProduct?.irul || '/placeholder-yarn.jpg', // fallback image
              sampleProductName: sampleProduct?.pname || 'Sample Product'
            };
          } catch (brandError) {
            console.error(`Error fetching sample product for brand ${brand.name}:`, brandError);
            return {
              id: brand.id,
              name: brand.name,
              discountRate: brand.discountRate,
              productCount: brand._count.products,
              image: '/placeholder-yarn.jpg',
              sampleProductName: 'Sample Product'
            };
          }
        })
      );

      console.log(`Found ${brandsWithImages.length} active brands`);
      return brandsWithImages;

    } catch (error) {
      console.error("Error in GetAllBrands:", error);
      // Return empty array instead of throwing to prevent page crash
      return [];
    }
  },
  ['brands-list-v2'],
  {
    revalidate: 43200, // 12 hours
    tags: ['brands', 'products']
  }
);

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
    const [newArrivalsData, brandsData, popularProductsData] = await Promise.all([
      GetNewArrivals().catch(error => {
        console.error("Error fetching new arrivals:", error);
        return [];
      }),
      GetAllBrands().catch(error => {
        console.error("Error fetching brands:", error);
        return [];
      }),
      GetPopularProducts().catch(error => {
        console.error("Error fetching popular products:", error);
        return [];
      })
    ]);

    console.log("Data fetched successfully:", {
      newArrivals: newArrivalsData.length,
      brands: brandsData.length,
      popularProducts: popularProductsData.length
    });

    // Generate JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": "Patel Yarn House",
      "description": "Premium yarn supplier and retailer in Bangalore offering wide range of cotton, acrylic, wool yarns from top brands with bulk order facilities",
      "url": "https://patelyarnhouse.com", // Replace with actual domain
      "telephone": "+91-96495 19951", // Add actual phone number
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "#24, Patel Yarn House ,Raja Market, Avenue Road ,Bangalore - 560002", // Add actual address
        "addressLocality": "Bangalore",
        "addressRegion": "Karnataka",
        "postalCode": "XXXXXX", // Add actual postal code
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "12.967917614960797",
        "longitude": "77.57618537418816"
      },
      "openingHours": "Mo-Sa 09:00-20:00", // Add actual opening hours
      "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Net Banking",
      "priceRange": "₹70",
      "image": "https://instagram.fblr8-1.fna.fbcdn.net/v/t51.2885-19/524167253_17845624560534818_6458680476322320255_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fblr8-1.fna.fbcdn.net&_nc_cat=102&_nc_oc=Q6cZ2QF2GE1iB6FjkHX_uGnlcXyntuE8NxpoK5koguvZLuvzSG72fEEFrdjAui4PP01fn6I&_nc_ohc=IsppMLsWzDQQ7kNvwGEBsNz&_nc_gid=Divttl6UKe0uFExXJKzxCg&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfRIy5l1R0xf8rWyJpbnXqXrFTXvbP2mc8G7I96oh_KCeg&oe=688C55F3&_nc_sid=7a9f4b", // Add actual store image
      "sameAs": [
        // Add social media links if available
        "https://www.facebook.com/patelyarnhouse",
        "https://www.instagram.com/patelyarnhouse"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Yarn Products",
        "itemListElement": popularProductsData.map((product, index) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": product.pname,
            "brand": product.brand?.name,
            "image": product.irul,
            "description": `Quality ${product.pname} from ${product.brand?.name}`
          },
          "position": index + 1
        }))
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8", // Add actual rating
        "reviewCount": "150" // Add actual review count
      }
    };

    return (
      <>
        {/* JSON-LD StructuredData*/}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* SEO-optimized main content */}
        <main role="main">
          <Hero />
          <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            <NewArri products={newArrivalsData} />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 lg:space-y-16">
              <Disc />
              <BrandsList brands={brandsData} />
              <BulkBenefits />
              <GetPopular products={popularProductsData} />
              <Map />
            </div>
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error("Error in Home component:", error);

    // Fallback UI in case of complete failure
    return (
      <main role="main">
        <Hero />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Premium Yarn Collection...</h2>
            <p>We are preparing your content. Please refresh if this takes too long.</p>
          </div>
        </div>
      </main>
    );
  }
}

// Updated NewArri to accept props instead of fetching data
function NewArri({ products }: { products: any[] }) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="new-arrivals-heading">
      <NewArrivals products={products} />
    </section>
  )
}

// Static discount section (no caching needed)
function Disc() {
  return (
    <section className="w-full" aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="sr-only">Special Offers and Discounts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="rounded-none p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-bold" aria-label="10 percent">10%</p>
              <p className="font-extrabold text-4xl sm:text-5xl lg:text-6xl">OFF</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-bold text-3xl sm:text-4xl lg:text-5xl">ON ALL</p>
              <p className="font-bold text-4xl sm:text-5xl lg:text-6xl">BRANDS</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-none p-4 sm:p-6 lg:p-8 text-center text-white bg-primary">
          <p className="text-2xl sm:text-4xl lg:text-6xl font-extrabold leading-tight">
            FREE DELIVERY
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            ₹2000 ONWARDS
          </p>
        </Card>
      </div>
    </section>
  )
}

// Updated BrandsList to replace CategoriesList
function BrandsList({ brands }: { brands: any[] }) {
  return (
    <section className="w-full" aria-labelledby="brands-heading">
      <div className="text-center mb-8 sm:mb-12">
        <h2 id="brands-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          SHOP BY BRAND
        </h2>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">
          Discover premium yarns from trusted brands. The perfect brand for your knitting and crochet projects.
        </p>
      </div>
      <BrandsScroll brands={brands} />
    </section>
  );
}

// Static bulk benefits section
function BulkBenefits() {
  return (
    <section className="w-full bg-white" aria-labelledby="bulk-benefits-heading">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6 items-stretch">

        {/* Left Column: Benefits List */}
        <div className="lg:col-span-2 flex flex-col justify-center gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex-shrink-0" aria-hidden="true">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="font-medium leading-relaxed text-sm sm:text-base lg:text-lg">
              Competitive Pricing for<br />Bulk Yarn Orders
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex-shrink-0" aria-hidden="true">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <p className="font-medium leading-relaxed text-sm sm:text-base lg:text-lg">
              Quality Assurance for<br />All Yarn Products
            </p>
          </div>
        </div>

        {/* Middle Column: Title */}
        <Card className="lg:col-span-3 rounded-none bg-primary">
          <CardContent className="p-6 sm:p-8 lg:p-12 text-center lg:text-right text-white">
            <h2 id="bulk-benefits-heading" className="text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight">
              BULK<br />BENEFITS
            </h2>
          </CardContent>
        </Card>

        {/* Right Column: WhatsApp Link */}
        <div className="lg:col-span-1 flex justify-center">
          <Link
            href={'https://wa.link/stc3xk'}
            className="w-full"
            aria-label="Contact us on WhatsApp for bulk yarn orders"
          >
            <Card className="bg-primary text-white w-full rounded-none h-full min-h-[120px] sm:min-h-[150px] lg:min-h-full">
              <CardContent className="p-0 flex items-center justify-center w-full h-full">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" aria-hidden="true" />
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
    <section className="w-full" aria-labelledby="bestsellers-heading">
      <div className="text-center mb-8 sm:mb-12">
        <h2 id="bestsellers-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          BEST SELLING YARNS
        </h2>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8">
          Browse our most popular premium yarn collection for knitting and crochet
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
    <section className="w-full mb-5" aria-labelledby="visit-store-heading">
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
                title="Patel Yarn House Store Location in Bangalore"
              />
              {/* Clickable Overlay */}
              <a
                href="https://maps.app.goo.gl/aJienJi5AnayPu3m9"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
                aria-label="Open Patel Yarn House location in Google Maps"
              >
                <span className="sr-only">Open in Google Maps</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="border-l-4 border-primary pl-4 sm:pl-6 lg:pl-8 space-y-4 sm:space-y-6">
          <h2 id="visit-store-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Visit <span className="text-primary">Us</span> at Patel Yarn House
          </h2>
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-700">
            From cotton and acrylic to specialty wool blends, we offer all types of premium yarns to suit your every knitting and crochet need.
            Whether you are a hobbyist crafter or a bulk yarn wholesaler, our shelves are stocked with vibrant colors and premium textures.
            Experience warm hospitality and expert guidance from our yarn specialists to help you find the perfect yarn for your project.
            We welcome bulk orders and ensure the best wholesale deals for businesses, retailers, and creative professionals alike!
          </p>

          <Button asChild size="lg" className="sm:mx-auto">
            <a
              href="https://maps.app.goo.gl/aJienJi5AnayPu3m9"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get directions to Patel Yarn House"
            >
              Get Directions
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}