'use client'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image, { StaticImageData } from 'next/image';
import { Truck, Shield, Award } from 'lucide-react';
import w1 from '@/app/assets/w3.jpg'
import { BulkOrderSection, ProductScroll } from './components/psec';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { ProductCard } from '../components/ProductCard';

const data = [
  {id:1,name:'wool',imgurl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu7JIaGyEYXdlNqD36IRIQ3aFRi5sDpywsSg&s'},
  {id:2,name:'cotton',imgurl:'https://5.imimg.com/data5/SELLER/Default/2021/6/EQ/HB/UB/7334780/2-40s-combed-mercerized-cotton-yarn-500x500-500x500.jpg'},
  {id:3,name:'Bamboo',imgurl:'https://www.ganxxet.com/cdn/shop/files/BAMBOO-SAND_400x.jpg?v=1717760134'},
  {id:4,name:'Mohair',imgurl:'https://static.fibre2fashion.com/MemberResources/LeadResources/9/2023/3/Seller/23210545/Images/23210545_0_%E8%8A%B1%E5%BC%8F1.png?tr=w-260,h-260,cm-pad_resize,bg-F3F3F3'},
  {id:5,name:'Polyster',imgurl:'https://2.wlimg.com/product_images/bc-full/2022/11/10878802/100-40d-white-black-polyester-spandex-covered-yarn-1668751320-6630389.jpeg'},
  {id:6,name:'Acrylic',imgurl:'https://m.media-amazon.com/images/I/61Ek8QW6tFL.jpg'},
  {id:7, name:'wool blend',imgurl:'https://knittinghappiness.com/cdn/shop/products/DSR036_1000x1000.jpg?v=1667904098'}
]

export default function Home(){
  return (
    <>
      {/* Add CSS animations in a style tag */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-on-scroll {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-on-scroll-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
        
        .animate-on-scroll-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
      `}</style>
      
      <main className='mx-4 md:mx-5'>
        <div className="animate-fade-in">
          <HeroSection />
        </div>
        <div className="animate-on-scroll delay-200">
          <Discover/>
        </div>
        <div className="animate-on-scroll delay-300">
          <ProductScroll/>
        </div>
        <div className="animate-on-scroll delay-400">
          <BulkBenefits/>
        </div>
        <div className="animate-on-scroll delay-500">
          <PopularProducts/>
        </div>
        <div className="animate-on-scroll delay-600">
          <WhyChooseUs/>
        </div>
        <div className="animate-on-scroll delay-700">
          <BulkOrderSection/>
        </div>
      </main>
    </>
  );
}

function HeroSection() {
  return (
    <section className="bg-purple-400 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Content */}
          <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left animate-on-scroll-left delay-100">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight">
              Discover Premium<br />
              Yarns for Your<br />
              Business
            </h1>
            <p className="text-base md:text-lg text-gray-800 max-w-md mx-auto lg:mx-0">
              At Patel Yarn House, we offer a diverse selection of high-quality yarns perfect for wholesale buyers. Elevate your projects with our premium materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="bg-black text-white hover:bg-gray-800 px-6 md:px-8 py-4 md:py-6 text-sm md:text-base transform hover:scale-105 transition-transform duration-300">
                Shop Now
              </Button>
              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white px-6 md:px-8 py-4 md:py-6 text-sm md:text-base transform hover:scale-105 transition-transform duration-300">
                Explore More
              </Button>
            </div>
          </div>
          
          {/* Right Image Container */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none animate-on-scroll-right delay-300">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-500">
              <CardContent className="p-4 md:p-6 lg:p-8">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="relative overflow-hidden rounded-lg bg-gray-100 w-full h-full">
                    <Image
                      src={w1}
                      alt="Premium Yarn"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
                {/* Price Tag */}
                <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-[#8a79ab] text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium animate-pulse">
                  Premium Quality
                </div>
                {/* Info Badge */}
                <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 bg-blue-600 text-white p-3 md:p-4 rounded-lg shadow-lg max-w-xs transform hover:scale-105 transition-transform duration-300">
                  <div className="text-xs md:text-sm font-medium">More than 44</div>
                  <div className="text-xs opacity-90">yarn varieties</div>
                  <div className="text-xs opacity-90">available in stock</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function Discover() {
  return (
    <section className="p-4 md:p-6 lg:p-8 mx-2 md:mx-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="text-center lg:text-left animate-on-scroll-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Discover Our Diverse Yarn Collection Today
            </h2>
          </div>
          <div className="space-y-6 text-center lg:text-left animate-on-scroll-right delay-200">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              At Patel Yarn House, we offer an extensive selection of yarns to suit every project. Choose from luxurious wool, soft cotton, and versatile acrylic options, each designed to inspire creativity. Whether you&apos;re a seasoned crafter or just starting out, our variety ensures you&apos;ll find the perfect yarn for your needs.
            </p>
            <Button className='px-6 md:px-8 py-4 md:py-6 text-sm md:text-base transform hover:scale-105 transition-transform duration-300'>
              Explore
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BulkBenefits() {
  const benefits = [
    { icon: <Truck className="w-6 h-6 md:w-8 md:h-8" />, title: "Free Shipping", description: "Complimentary shipping on bulk orders over ₹3,000" },
    { icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />, title: "Quality Guarantee", description: "100% satisfaction guarantee on all yarn purchases" },
    { icon: <Award className="w-6 h-6 md:w-8 md:h-8" />, title: "Premium Materials", description: "Only the finest materials sourced globally" }
  ];

  return (
    <section className="p-4 md:p-6 lg:p-8 mx-2 md:mx-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className={`bg-white border border-gray-200 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-2 animate-on-scroll delay-${(index + 1) * 100}`}>
              <CardContent className="p-6 md:p-8 text-center">
                <div className="text-purple-600 mb-4 flex justify-center transform hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

async function PopularProducts() {
  const GetPopularProducts = unstable_cache(
    async () => {
      const data = await prisma.product.findMany({
        where: { Shown: true },
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
      revalidate: 2592000, // 30 days in seconds (30 * 24 * 60 * 60)
      tags: ['products', 'popular-products']
    }
  );

  const data = await GetPopularProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8 animate-on-scroll">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Popular Products
        </h2>
        <p className="text-base md:text-lg text-gray-600">Our Top Products That Have Been Purchased In this Month</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-center justify-items-center">
        {data.map((item, index) => (
          <div key={item.id} className={`animate-on-scroll delay-${(index + 1) * 100} transform hover:scale-105 transition-transform duration-300`}>
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WhyChooseUs() {
  return (
    <section className="bg-white p-4 md:p-6 lg:p-8 mx-2 md:mx-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 animate-on-scroll-left">
            <div className="aspect-square bg-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-300 transition-colors duration-500">
              <div className="text-center text-gray-500">
                <div className="text-6xl md:text-7xl lg:text-8xl mb-4 transform hover:scale-110 transition-transform duration-500">🏭</div>
                <p className="text-lg md:text-xl font-medium">Our Office</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 lg:space-y-8 order-1 lg:order-2 text-center lg:text-left animate-on-scroll-right delay-200">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Why Choose Patel Yarn House for Your Needs
            </h2>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              With years of experience in the yarn industry, we understand what businesses need. Our commitment to quality, competitive pricing, and exceptional service makes us the preferred choice for bulk yarn purchases.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <div className="text-center lg:text-left animate-on-scroll delay-400 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Expertise</h3>
                <p className="text-sm md:text-base text-gray-600">Over 25 years in the textile industry</p>
              </div>
              <div className="text-center lg:text-left animate-on-scroll delay-500 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Value</h3>
                <p className="text-sm md:text-base text-gray-600">Competitive wholesale pricing guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}