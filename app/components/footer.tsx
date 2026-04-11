import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-purple-900 to-purple-800 text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-700 rounded-full mix-blend-multiply opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-800 rounded-full mix-blend-multiply opacity-20 blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="text-xl font-medium mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Patel<span className="font-light">Yarn House</span>
            </div>
            <p className="text-purple-200 text-sm">
              Your trusted destination for premium quality yarns and textile materials. Crafting dreams with every thread.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link href="https://www.instagram.com/patelyarnhouse" className="text-purple-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Instagram size={20} className="hover:drop-shadow-glow" />
              </Link>
              <Link href="#" className="text-purple-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Facebook size={20} className="hover:drop-shadow-glow" />
              </Link>
              <Link href="#" className="text-purple-200 hover:text-white transition-colors duration-200 hover:scale-110 transform">
                <Twitter size={20} className="hover:drop-shadow-glow" />
              </Link>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3 text-sm text-purple-200">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <div>
                  <p>#24, Patel Yarn House</p>
                  <p>Raja Market, Avenue Road</p>
                  <p>Bangalore - 560002</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-purple-200">
                <Phone size={16} />
                <span>+91 87920 66951</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-purple-200">
                <Mail size={16} />
                <span>patelyarnhouseenq@gmail.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  About
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Products
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Help</h3>
            <ul className="mt-4 space-y-2">
              <li>
                {/* External link, so we keep the <a> tag */}
                <a href="https://merchant.razorpay.com/policy/QhsSsCifwRHC1O/refund" target="_blank" rel="noopener noreferrer" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Refund Policy
                </a>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                 {/* External link, so we keep the <a> tag */}
                <a href="https://merchant.razorpay.com/policy/QhsSsCifwRHC1O/refund" target="_blank" rel="noopener noreferrer" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Delivery Policy
                </a>
              </li>
              <li>
                <Link href="#" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Customer Service</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-200 hover:text-white text-sm flex items-center group">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 group-hover:w-2 transition-all duration-200"></span>
                  Wholesale Inquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-purple-800/50 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-purple-300">© 2025 Patel Yarn House. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/privacy-policy" className="text-xs text-purple-300 hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link href="#" className="text-xs text-purple-300 hover:text-white transition-colors duration-200">Terms of Service</Link>
            {/* External link, so we keep the <a> tag */}
            <a href="https://merchant.razorpay.com/policy/QhsSsCifwRHC1O/refund" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-300 hover:text-white transition-colors duration-200">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}