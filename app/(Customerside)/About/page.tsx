import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Users, Heart, Star, ArrowRight, Truck, Calendar, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const stats = [
    { icon: Calendar, number: '15+', label: 'Years of Excellence' },
    { icon: Users, number: '10,000+', label: 'Happy Customers' },
    { icon: Package, number: '500+', label: 'Yarn Varieties' },
    { icon: Heart, number: '100%', label: 'Quality Guaranteed' }
  ];

  const values = [
    { title: 'Quality Promise', desc: 'Every skein carries our legacy of excellence' },
    { title: 'Community First', desc: 'Supporting creators and entrepreneurs across India' },
    { title: 'Trust & Reliability', desc: '15+ years of consistent, dependable service' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                Since 2009
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Weaving Dreams with <span className="text-purple-200">Quality Yarn</span>
              </h1>
              <p className="text-lg md:text-xl text-purple-100 leading-relaxed">
                Where every thread tells a story, and every creation begins with quality you can trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                  <Link href="/products">
                    Shop Now
                  </Link>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  Our Story
                </Button>
              </div>
            </div>
            
            {/* Image Placeholder */}
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8">
                <div className="bg-white/10 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <Package className="h-16 w-16 mx-auto mb-2" />
                    <p>Yarn Collection Image</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Story Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            A Legacy Woven with <span className="text-purple-600">Trust</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            For over 15 years, Patel Yarn Store has been a cornerstone of Bangalore&apos;s thriving yarn industry. 
            What began as a humble local business has grown into a trusted yarn wholesaler and supplier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                From Warehouse to the World
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                Our journey started in a modest yarn warehouse in Bangalore, filled with rows of rich colors, 
                textures, and possibilities. It was a place where tailors came for their daily threads, 
                and artisans sourced material for their next big project.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50/50 border-purple-200">
            <CardContent className="p-6">
              <div className="bg-purple-100 rounded-lg h-48 flex items-center justify-center">
                <div className="text-center text-purple-600">
                  <Truck className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Warehouse Image</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-indigo-50/50 border-indigo-200 md:order-2">
            <CardContent className="p-6">
              <div className="bg-indigo-100 rounded-lg h-48 flex items-center justify-center">
                <div className="text-center text-indigo-600">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Online Store Image</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 md:order-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                Now Online: Buy Yarn, Build Dreams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed mb-4">
                Today, Patel Yarn Store Online is a one-stop destination for crochet yarn, knitting accessories, 
                bulk yarn for tailors, and affordable yarn across India with no compromise on quality.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Crochet yarn in India in wide variety of textures
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Knitting accessories for all skill levels
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Bulk yarn for businesses and tailors
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built on Values. Backed by Community.
            </h2>
            <p className="text-lg text-purple-100 max-w-3xl mx-auto">
              What makes Patel Yarn Store special isn&apos;t just our yarn — it&apos;s our roots. For us, this is more than a business. 
              It&apos;s a family legacy, built on hard work, honesty, and meaningful connections.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {values.map((value, index) => (
              <Card key={index} className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-100">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center space-y-6">
            <p className="text-lg text-purple-200">
              Ready to start your next project?
            </p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              <Link href="/products">
                Explore Our Collection
              </Link>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Footer CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-4xl mx-auto border-purple-200">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-gray-800">
              We&apos;re honored to be part of your creative process
            </CardTitle>
            <CardDescription className="text-lg">
              And we promise to deliver the quality, care, and consistency you deserve, one skein at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                Start Shopping
              </Button>
              <Button size="lg" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                <Link href="/">
                  Contact Us
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}