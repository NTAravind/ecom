import { Suspense, cache } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, ShoppingCart, Package, Truck, Award, Phone, Mail, MapPin, ArrowRight, Rss, BookOpen, Sparkles, Play } from 'lucide-react';
import Image from 'next/image';
import prisma from '@/lib/prisma'; // Adjust path as needed
import w1 from '../assets/w1.jpg'; 
import w2 from '../assets/w2.webp';
import Link from 'next/link';

// --- DATA FETCHING & CACHING ---

const getPageData = cache(async () => {
  const data = {
    "hero": {
      "heading": "Discover Premium Yarns for Your Business",
      "subheading": "At Patel Yarn House, we offer a diverse selection of high-quality yarns perfect for wholesale buyers. Elevate your projects with our premium materials and exceptional service.",
      "actions": ["Shop Now", "Learn More"]
    },
    "explore_section": {
      "title": "Explore",
      "heading": "Discover Our Diverse Yarn Collection Today",
      "description": "At Patel Yarn House, we offer an extensive selection of yarns to suit every project. Choose from luxurious wool, soft cotton, and versatile acrylic options, each designed to inspire creativity.",
      "actions": ["Shop", "Learn More"]
    },
    "benefits_section": {
      "title": "Unlock the Benefits of Bulk Yarn Purchases Today!",
      "items": [
        {
          "title": "Cost Savings That Make a Difference",
          "description": "Bulk purchases lead to significant savings on every order.",
          "action": ''
        },
        {
          "title": "Extensive Selection of Yarns",
          "description": "Find the perfect yarn for every project with our vast inventory.",
          "action": "Shop Now"
        },
        {
          "title": "Fast and Reliable Shipping",
          "description": "Receive your yarn quickly so you can keep creating without delays.",
          "action": "Order Today"
        }
      ]
    },
    "why_choose_us": {
      "title": "Why Choose Patel Yarn House for Your Needs",
      "description": "With years of experience in the yarn industry, we understand the unique needs of our customers. Our commitment to exceptional customer service ensures you receive the support you deserve.",
      "points": [
        { "title": "Expertise", "description": "Extensive knowledge to guide your yarn selections." },
        { "title": "Value", "description": "Competitive pricing that fits your budget needs." }
      ],
      "actions": ['shop  now']
    },
    "testimonials": [
      {
        "quote": "Patel Yarn House has transformed our inventory! Their quality and service are unmatched.",
        "author": "Emily Johnson",
        "position": "Owner, Craft Co."
      }
    ],
    "cta_bulk_order": {
      "heading": "Ready for Your Bulk Order?",
      "subheading": "Contact us today for unbeatable wholesale yarn prices!",
      "actions": ["Inquire", "Learn More"]
    },
    "highlights": {
      "title": "Explore Our Offerings",
      "items": [
        { "title": "Yarn Types", "description": "Discover a variety of yarns for your needs" },
        { "title": "Color Palette", "description": "Browse our extensive color selections today" },
        { "title": "Wholesale Deals", "description": "Get the best prices on bulk purchases" },
        { "title": "Customer Support", "description": "We're here to assist you with inquiries" }
      ]
    },
    "blog_section": {
      "title": "From Our Blog",
      "articles": [
        { "title": "Yarn Tips", "description": "Learn how to choose the right yarn" },
        { "title": "Craft Ideas", "description": "Get inspired with our latest projects" },
        { "title": "Yarn Care", "description": "Tips for maintaining your yarn quality" },
        { "title": "FAQs", "description": "Find answers to common questions" }
      ]
    }
  };
  return data;
});

async function getProducts() {
  try {
    const products = await (prisma.product as  any).findMany({
      where: { Shown: true },
      orderBy: { pname: 'asc' },
      take: 12,
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// --- REUSABLE & SECTION COMPONENTS ---

function ProductCard({ product }: { product: any }) {
  return (
    <Card className="group bg-white border border-black shadow-sm hover:shadow-lg transition-all duration-500 flex-none w-80">
      <div className="aspect-[4/3] bg-white border-b border-black overflow-hidden">
        <Image
          src={product.iurl1 || product.irul || "/api/placeholder/400/300"}
          alt={product.pname}
          width={400}
          height={300}
          className="object-contain w-full h-full p-1 sm:p-2 group-hover:scale-105 transition-transform duration-700"
          unoptimized
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="font-bold text-black text-sm sm:text-base lg:text-lg leading-tight line-clamp-2">{product.pname}</CardTitle>
            <p className="text-sm text-black font-light truncate">{product.brand}</p>
          </div>
          <Badge variant="outline" className="text-xs border-black text-black ml-2 flex-shrink-0">
            {product.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1 text-xs sm:text-sm text-black">
          <span>Weight: {product.y_weight}</span>
          <span>•</span>
          <span>Stock: {product.stock}</span>
        </div>
        <Separator className="my-4 bg-black" />
        <div className="flex justify-between items-center">
          <span className="text-2xl font-light text-black">₹{product.price.toLocaleString()}</span>
        
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsLoading() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-black">Featured Products</h2>
          <p className="text-lg text-black max-w-2xl mx-auto font-light">
            Loading our yarn collections...
          </p>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-6 pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-black rounded-xl p-6 animate-pulse flex-none w-80">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}

async function ProductsSection() {
  const products = await getProducts();
  const data = await getPageData();

  if (products.length === 0) {
    return (
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-black">Featured Products</h2>
          <p className="text-lg text-black">No products available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="text-sm border-black text-black mb-4">
            {data.explore_section.title}
          </Badge>
          <h2 className="text-4xl font-bold mb-4 text-black">{data.explore_section.heading}</h2>
          <p className="text-lg text-black max-w-2xl mx-auto font-light">
            {data.explore_section.description}
          </p>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <div className="text-center mt-12 flex gap-4 justify-center">
          <Link href='/products'>
          <Button variant="outline" size="lg" className="px-8 border-black text-black hover:bg-black hover:text-white">
            {data.explore_section.actions[0]}
          </Button>
        </Link>
        </div>
      </div>
    </section>
  );
}

// --- HERO SECTION (Sketch Book Style with Amethyst Haze Theme) ---
function HeroSection({ data }: { data: any }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      
      {/* Subtle amethyst halftone pattern background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #9333ea 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, #a855f7 1px, transparent 1px),
              radial-gradient(circle at 25% 75%, #8b5cf6 1px, transparent 1px),
              radial-gradient(circle at 75% 25%, #7c3aed 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 30px 30px, 60px 60px, 40px 40px',
            backgroundPosition: '0 0, 15px 15px, 30px 30px, 5px 5px'
          }}
        />
      </div>

      {/* Subtle amethyst action lines */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-px bg-gradient-to-r from-purple-400 to-transparent"
            style={{
              height: '150px',
              transformOrigin: '0 0',
              transform: `translate(-50%, -50%) rotate(${i * 45}deg)`
            }}
          />
        ))}
      </div>

      {/* Subtle amethyst geometric shapes */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-16 left-20 w-12 h-12 border-2 border-purple-300 transform rotate-45" />
        <div className="absolute top-32 right-32 w-8 h-8 border-2 border-violet-300 rounded-full" />
        <div className="absolute bottom-24 left-40 w-10 h-10 border-2 border-amethyst-300 transform rotate-12" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            
            {/* Comic book style badge - amethyst theme */}
            <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-100 to-violet-100 border-3 border-purple-800 text-lg font-black text-purple-900 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                PREMIUM QUALITY
              </span>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-3 left-8 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-purple-800" />
              <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-3 border-r-3 border-t-6 border-transparent border-t-purple-100" />
            </div>

            {/* Comic book style main heading - amethyst tones */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
                  style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                <div className="relative">
                  <span className="block text-purple-900 transform -rotate-1 drop-shadow-lg"
                        style={{ textShadow: '3px 3px 0px #e5e7eb, -1px -1px 0px #f3f4f6' }}>
                    DISCOVER
                  </span>
                  <div className="absolute -top-2 -right-8 bg-purple-600 text-white px-2 py-1 text-sm font-black border-2 border-purple-900 transform rotate-12">
                    NEW!
                  </div>
                </div>
                <span className="block text-violet-800 transform rotate-1 drop-shadow-lg"
                      style={{ textShadow: '3px 3px 0px #e5e7eb, -1px -1px 0px #f3f4f6' }}>
                  PREMIUM
                </span>
                <div className="relative">
                  <span className="block text-purple-700 transform -rotate-0.5 drop-shadow-lg"
                        style={{ textShadow: '3px 3px 0px #e5e7eb, -1px -1px 0px #f3f4f6' }}>
                    YARNS
                  </span>
                  <div className="absolute -bottom-2 -left-6 bg-violet-500 text-white px-2 py-1 text-sm font-black border-2 border-purple-900 transform -rotate-12">
                    BEST!
                  </div>
                </div>
                <span className="block text-4xl md:text-5xl lg:text-6xl text-gray-700 transform rotate-0.5 drop-shadow-lg"
                      style={{ textShadow: '2px 2px 0px #e5e7eb, -1px -1px 0px #f9fafb' }}>
                  FOR YOUR BUSINESS
                </span>
              </h1>
              
              {/* Comic book style description box - amethyst theme */}
              <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 border-3 border-purple-800 p-6 transform rotate-1 shadow-lg">
                <div className="absolute -top-3 -left-3 bg-purple-600 text-white border-2 border-purple-900 px-2 py-1 text-xs font-black transform -rotate-12">
                  INFO
                </div>
                <p className="text-lg md:text-xl font-bold leading-relaxed text-purple-900"
                   style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  {data.hero.subheading}
                </p>
                {/* Amethyst dots pattern */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Comic book style action buttons - amethyst theme */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-6">
              <div className="relative group">
                <Button 
                  size="lg" 
                  className='bg-purple-600'
                 style={{ 
                    fontFamily: 'Impact, Arial Black, sans-serif'
                  }}
                >
                  {data.hero.actions[0]}
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
                {/* Comic book action effect */}
                <div className="absolute -top-2 -right-2 bg-purple-100 text-purple-900 px-2 py-1 text-xs font-black border-2 border-purple-800 transform rotate-12 opacity-0 group-hover:opacity-100 transition-opacity">
                  GO!
                </div>
              </div>
              
              <div className="relative group">
      
                <div className="absolute -top-2 -left-2 bg-violet-100 text-purple-900 px-2 py-1 text-xs font-black border-2 border-purple-800 transform -rotate-12 opacity-0 group-hover:opacity-100 transition-opacity">
                  WATCH!
                </div>
              </div>
            </div>

            {/* Comic book style trust indicators - amethyst theme */}
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-8">
              <div className="relative bg-gradient-to-r from-purple-100 to-violet-100 border-3 border-black px-4 py-3 transform -rotate-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-purple-600 text-purple-800" />
                  <span className="font-black text-purple-900 text-lg">4.9/5</span>
                </div>
                <div className="absolute -top-1 -right-1 bg-purple-600 text-white px-1 text-xs font-black border border-purple">★</div>
              </div>
              
              <div className="bg-gradient-to-r from-violet-100 to-purple-100 border-3 border-black px-4 py-3 font-black text-purple-900 text-lg transform rotate-2 shadow-lg">
                500+ CLIENTS
              </div>
              
              <div className="relative bg-gradient-to-r from-purple-600 to-violet-700 border-3 border-black px-4 py-3 font-black text-white transform -rotate-1 shadow-lg">
                PREMIUM
                <div className="absolute -bottom-2 -right-2 bg-purple-100 text-purple-900 px-1 py-0.5 text-xs font-black border-2 border-purple-800 transform rotate-45">
                  #1
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Comic book panel style with amethyst theme */}
          <div className="relative">
            
            {/* Main comic book panel */}
            <div className="relative">
              <div className="aspect-square bg-white border-4 border-purple-900 overflow-hidden shadow-2xl transform rotate-2 relative">
                {/* Comic book panel header */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-violet-700 border-b-3 border-purple-900 p-2 z-10">
                  <div className="text-center font-black text-white text-sm" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                    PREMIUM YARN COLLECTION
                  </div>
                </div>
                
                <div className="pt-12 h-full bg-gradient-to-br from-purple-50 to-violet-50">
                  <Image 
                    src={w1} 
                    alt="Premium yarn collection" 
                    width={600} 
                    height={600} 
                    className="object-cover w-full h-full"
                    style={{ 
                      filter: 'sepia(0.2) saturate(0.9) hue-rotate(270deg)',
                      mixBlendMode: 'multiply'
                    }}
                    priority
                  />
                </div>
                
                {/* Comic book panel corners */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-purple-900"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-purple-900"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-purple-900"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-purple-900"></div>
              </div>

              {/* Comic book style floating speech bubbles - amethyst theme */}
              <div className="absolute -bottom-8 -left-8 bg-white border-3 border-purple-900 p-4 shadow-xl transform rotate-6 max-w-32">
                <div className="text-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-purple-900 mx-auto mb-2"></div>
                  <span className="font-black text-purple-900 text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>IN STOCK!</span>
                  <p className="text-xs font-bold text-purple-700 mt-1">1000+ varieties!</p>
                </div>
                {/* Speech bubble tail */}
                <div className="absolute -top-3 left-6 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-purple-900"></div>
                <div className="absolute -top-2 left-6 w-0 h-0 border-l-3 border-r-3 border-b-6 border-transparent border-b-white"></div>
              </div>

              {/* Comic book style quality burst - amethyst theme */}
              <div className="absolute -top-8 -right-8 bg-gradient-to-r from-purple-100 to-violet-100 border-3 border-purple-900 p-3 shadow-xl transform -rotate-8"
                   style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
                <div className="text-center">
                  <div className="text-xl font-black text-purple-600">★★★★★</div>
                  <div className="text-xs font-black text-purple-900">QUALITY</div>
                </div>
              </div>

              {/* Comic book thought bubble - amethyst theme */}
              <div className="absolute top-8 -left-12 bg-white border-3 border-purple-900 p-3 shadow-xl transform -rotate-12"
                   style={{ clipPath: 'circle(50% at 50% 50%)' }}>
                <span className="font-black text-purple-900 text-xs">WOW!</span>
                {/* Thought bubble dots */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-3 h-3 bg-white border-2 border-purple-900 rounded-full"></div>
                  <div className="w-2 h-2 bg-white border-2 border-purple-900 rounded-full ml-2 -mt-1"></div>
                  <div className="w-1.5 h-1.5 bg-white border border-purple-900 rounded-full ml-3 -mt-1"></div>
                </div>
              </div>
            </div>

            {/* Subtle amethyst background effects */}
            <div className="absolute inset-0 -z-10 opacity-20">
              {/* Action lines */}
              <div className="absolute top-1/4 left-1/4 w-20 h-px bg-purple-400 transform rotate-45"></div>
              <div className="absolute bottom-1/4 right-1/4 w-16 h-px bg-violet-400 transform -rotate-45"></div>
              <div className="absolute top-1/2 left-0 w-12 h-px bg-purple-300 transform rotate-90"></div>
              
              {/* Subtle geometric shapes */}
              <div className="absolute -top-4 left-1/3 w-8 h-8 border-2 border-purple-300 transform rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle amethyst bottom border */}
    
    </section>
  );
}

// --- MAIN PAGE COMPONENT ---

const YarnBusinessWebsite = async () => {
  const data = await getPageData();

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* Hero Section */}
      <HeroSection data={data} />

      {/* Highlights Section */}
      <section className="py-24 px-4 bg-gray-50 border-b border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{data.highlights.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {data.highlights.items.map((item, index) => (
              <Card key={item.title} className="bg-white border-black text-center h-full">
                <CardHeader>
                  <CardTitle className="font-bold text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-light">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products with Suspense */}
      <Suspense fallback={<ProductsLoading />}>
        <ProductsSection />
      </Suspense>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-gray-50 border-y border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">{data.benefits_section.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Award, ...data.benefits_section.items[0] },
              { icon: Package, ...data.benefits_section.items[1] },
              { icon: Truck, ...data.benefits_section.items[2] }
            ].map((benefit, index) => (
              <div key={benefit.title} className="text-center">
                <div className="w-16 h-16 bg-white border border-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="font-light leading-relaxed">{benefit.description}</p>
                <Link href='/products'>
                <Button variant="link" className="mt-4 text-black">{benefit.action} <ArrowRight className="ml-2 w-4 h-4" /></Button>
             </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-4 bg-white border-b border-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">{data.why_choose_us.title}</h2>
                <p className="text-lg leading-relaxed font-light">{data.why_choose_us.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                {data.why_choose_us.points.map(point => (
                  <div key={point.title} className="space-y-2">
                    <h3 className="text-2xl font-bold text-black">{point.title}</h3>
                    <p className="text-black font-light">{point.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                  <Button variant="outline" size="lg" className="px-8 border-black text-black  hover:text-white">
                    {data.why_choose_us.actions[0]}
                  </Button>
               
              </div>
            </div>
            <div className="aspect-[4/5] bg-white border border-black rounded-2xl overflow-hidden">
              <Image src={w2} alt="Yarn manufacturing" width={500} height={625} className="object-cover w-full h-full"/>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-black">{data.cta_bulk_order.heading}</h2>
              <p className="text-lg text-black max-w-2xl mx-auto font-light">{data.cta_bulk_order.subheading}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href='mailto:patelyarnhouse@gmail.com'>
              <Button size="lg" className=" hover:bg-gray-800 text-white px-8 gap-2">

                <Mail className="w-5 h-5" />
                {data.cta_bulk_order.actions[0]}
              </Button>
</Link>        
            </div>
            <div className="pt-8 text-center">
              <div className="flex items-center justify-center gap-2 text-black">
                <MapPin className="w-5 h-5" />
                <span className="font-light">#24, Patel Yarn House , Raja Market , Avenue Road </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default YarnBusinessWebsite;