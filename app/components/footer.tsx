import React from 'react';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white overflow-hidden">
      {/* Amethyst Haze Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>
      
      {/* Sparkle Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-300 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Patel Yarn House
            </h3>
            <p className="text-purple-200 leading-relaxed">
              Your trusted destination for premium quality yarns and textile materials. 
              Crafting dreams with every thread.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-purple-200">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-purple-700/50 rounded-lg flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
                  <Phone className="w-4 h-4 text-purple-200" />
                </div>
                <Link href="tel:8792066951" className="text-purple-100 hover:text-white transition-colors">
                  +91 87920 66951
                </Link>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-purple-700/50 rounded-lg flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
                  <Mail className="w-4 h-4 text-purple-200" />
                </div>
                <Link href="mailto:info@patelyarnhouse.com" className="text-purple-100 hover:text-white transition-colors">
                  info@patelyarnhouse.com
                </Link>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-purple-700/50 rounded-lg flex items-center justify-center group-hover:bg-purple-600/50 transition-colors">
                  <MapPin className="w-4 h-4 text-purple-200" />
                </div>
                <div className="text-purple-100">
                  <div>#24, Patel Yarn House</div>
                  <div>Raja Market, Avenue Road</div>
                  <div>Bangalore - 560001</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-purple-200">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-purple-100 hover:text-white hover:pl-2 transition-all duration-300">
                About Us
              </Link>
              <Link href="/products" className="block text-purple-100 hover:text-white hover:pl-2 transition-all duration-300">
                Our Products
              </Link>
              <Link href="/services" className="block text-purple-100 hover:text-white hover:pl-2 transition-all duration-300">
                Services
              </Link>
              <Link href="/contact" className="block text-purple-100 hover:text-white hover:pl-2 transition-all duration-300">
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-purple-600/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-purple-200 text-sm">
              © 2025 Patel Yarn House. All rights reserved.
            </div>

            {/* Policy Links */}
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy-policy" 
                className="text-purple-200 hover:text-white transition-colors hover:underline decoration-purple-400"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-conditions" 
                className="text-purple-200 hover:text-white transition-colors hover:underline decoration-purple-400"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/cookie-policy" 
                className="text-purple-200 hover:text-white transition-colors hover:underline decoration-purple-400"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
    </footer>
  );
};

export default Footer;