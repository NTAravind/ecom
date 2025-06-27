
"use client";
import { motion } from 'framer-motion';

import { Card, CardContent ,CardFooter,CardDescription,CardHeader,CardTitle,CardAction} from '@/components/ui/card';
export function ProductScroll(){


  const data = [
    {id:1,name:'Wool',imgurl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu7JIaGyEYXdlNqD36IRIQ3aFRi5sDpywsSg&s'},
    {id:2,name:'Cotton',imgurl:'https://5.imimg.com/data5/SELLER/Default/2021/6/EQ/HB/UB/7334780/2-40s-combed-mercerized-cotton-yarn-500x500-500x500.jpg'},
    {id:3,name:'Bamboo',imgurl:'https://www.ganxxet.com/cdn/shop/files/BAMBOO-SAND_400x.jpg?v=1717760134'},
    {id:4,name:'Mohair',imgurl:'https://static.fibre2fashion.com/MemberResources/LeadResources/9/2023/3/Seller/23210545/Images/23210545_0_%E8%8A%B1%E5%BC%8F1.png?tr=w-260,h-260,cm-pad_resize,bg-F3F3F3'},
    {id:5,name:'Polyester',imgurl:'https://2.wlimg.com/product_images/bc-full/2022/11/10878802/100-40d-white-black-polyester-spandex-covered-yarn-1668751320-6630389.jpeg'},
    {id:6,name:'Acrylic',imgurl:'https://m.media-amazon.com/images/I/61Ek8QW6tFL.jpg'},
    {id:7, name:'Wool Blend',imgurl:'https://knittinghappiness.com/cdn/shop/products/DSR036_1000x1000.jpg?v=1667904098'}
  ];

  // Triple the data for seamless infinite scroll
  const infiniteData = [...data, ...data, ...data];

  return (
    <>
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-gentle {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-5px);
          }
          60% {
            transform: translateY(-3px);
          }
        }
        
        .scroll-container {
          animation: scroll-left 45s linear infinite;
          animation-fill-mode: forwards;
        }
        
        .scroll-container:hover {
          animation-play-state: paused;
        }
        
        .fade-in-title {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .fade-in-subtitle {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
        
        .fade-in-description {
          animation: fade-in-up 0.8s ease-out 0.4s both;
        }
        
        .bounce-indicator {
          animation: bounce-gentle 2s infinite;
        }
        
        .card-hover:hover {
          transform: scale(1.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .image-hover:hover {
          transform: scale(1.1);
        }
        
        .overlay-hover:hover {
          opacity: 1;
        }
        
        .badge-hover:hover {
          opacity: 1;
          transform: translateY(0);
        }
        
        .title-hover:hover {
          color: #2563eb;
        }
      `}</style>
      
      <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 py-16 overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-800 mb-4 fade-in-title">
              Premium Yarn Collection
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto fade-in-description">
              Discover our curated selection of the finest yarns from around the world
            </p>
          </div>
        </div>
        
        {/* Auto-scrolling container */}
        <div className="relative">
          <div className="scroll-container flex gap-6" style={{ width: 'fit-content' }}>
            {infiniteData.map((yarn, index) => (
              <Card 
                key={`${yarn.id}-${index}`}
                className="flex-none w-80 bg-white/90 backdrop-blur-sm border-0 shadow-lg transition-all duration-500 cursor-pointer group card-hover"
              >
                <CardHeader className="pb-4">
                  <div className="relative overflow-hidden rounded-xl bg-slate-100 h-56 group-hover:shadow-lg transition-shadow duration-300">
                    <img
                      src={yarn.imgurl}
                      alt={yarn.name}
                      className="w-full h-full object-cover transition-transform duration-700 image-hover"
                     
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 overlay-hover" />
                    <div className="absolute bottom-4 left-4 transform translate-y-4 transition-all duration-300 opacity-0 badge-hover">
                      <span className="text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        Premium Quality
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 pb-6">
                  <CardTitle className="text-2xl font-bold text-slate-800 mb-3 transition-colors duration-300 title-hover">
                    {yarn.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-base leading-relaxed">
                    Premium quality {yarn.name.toLowerCase()} yarn perfect for your crafting projects and creative endeavors
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Gradient overlays for seamless effect */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-slate-100 to-transparent pointer-events-none z-10" />
        </div>
        
        {/* Scroll Indicator */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm bounce-indicator">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Auto-scrolling yarn collection</span>
          </div>
        </div>
      </div>
    </>
  );
};




export function BulkOrderSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="bg-purple-100 p-6 sm:p-10 m-5 mx-4 sm:mx-10 rounded-2xl border-2 border-purple-300 shadow-xl"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-900 mb-3">
              Ready for Your Bulk Order?
            </h2>
            <p className="text-lg sm:text-xl text-purple-800 opacity-90">
              Contact us today for wholesale pricing and bulk order processing.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all shadow-md"
          >
            Get Quote
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
