import React from 'react';
import { Truck, Home, Tag, Calendar } from 'lucide-react';

export default function MarqueeComponent() {
  const messages = [
    { 
      icon: Truck, 
      text: "Order Above ₹2000 - Free Delivery", 
      highlight: "₹2000" 
    },
    { 
      icon: Home, 
      text: "Welcome to Patel Yarn House", 
      highlight: "Patel Yarn House" 
    },
    { 
      icon: Tag, 
      text: "Best Prices Guaranteed", 
      highlight: "Best Prices" 
    },
    { 
      icon: Calendar, 
      text: "15 Years of Trusted Service", 
      highlight: "15 Years" 
    }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white py-3">
      {/* Animated marquee container */}
      <div 
        className="flex whitespace-nowrap hover:pause"
        style={{
          animation: 'marquee 30s linear infinite'
        }}
      >
        {/* First set of messages */}
        {messages.map((message, index) => (
          <div key={`first-${index}`} className="flex items-center mx-8 flex-shrink-0">
            <message.icon className="h-5 w-5 mr-2 text-purple-200" />
            <span className="text-sm md:text-base font-medium">
              {message.text.split(message.highlight)[0]}
              <span className="text-yellow-300 font-bold">{message.highlight}</span>
              {message.text.split(message.highlight)[1]}
            </span>
            <span className="mx-4 text-purple-300">•</span>
          </div>
        ))}
        
        {/* Duplicate set for seamless loop */}
        {messages.map((message, index) => (
          <div key={`second-${index}`} className="flex items-center mx-8 flex-shrink-0">
            <message.icon className="h-5 w-5 mr-2 text-purple-200" />
            <span className="text-sm md:text-base font-medium">
              {message.text.split(message.highlight)[0]}
              <span className="text-yellow-300 font-bold">{message.highlight}</span>
              {message.text.split(message.highlight)[1]}
            </span>
            <span className="mx-4 text-purple-300">•</span>
          </div>
        ))}
      </div>

      {/* Gradient overlay for fade effect */}
      <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-purple-600 to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-indigo-600 to-transparent pointer-events-none"></div>

      {/* Inline styles for animation - works in server components */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `
      }} />
    </div>
  );
}