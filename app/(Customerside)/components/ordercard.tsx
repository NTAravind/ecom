'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';

interface OrderCardProps {
  order: {
    id: string;
    pricepaid: number;
    createdAt: Date;
    paid: boolean;
    complete: boolean;
    orderItems: {
      id: string;
      quantity: number;
      product?: {
        id: string;
        pname: string;
        originalPrice: number;
        discountedPrice: number;
        irul: string;
        color: string;
        weight_g: number;
        brand: {
          name: string;
        };
      };
      yarnAccessory?: {
        id: string;
        name: string;
        originalPrice: number;
        discountedPrice: number;
        imageUrl: string;
      };
    }[];
  };
}

// Loading skeleton component
function OrderCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden animate-pulse">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="text-right sm:ml-4">
            <div className="h-7 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function OrderCard({ order }: OrderCardProps) {
  const [client, setClient] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    setClient(true);
  }, []);

  const getStatusColor = (paid: boolean, complete: boolean) => {
    if (complete) return 'bg-green-100 text-green-800';
    if (paid) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (paid: boolean, complete: boolean) => {
    if (complete) return 'Completed';
    if (paid) return 'Paid';
    return 'Pending Payment';
  };

  const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const copyOrderId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = order.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  if (!client) {
    return <OrderCardSkeleton />;
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header - Always visible */}
      <div 
        className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-gray-200 rounded transition-colors duration-150 group relative flex-shrink-0"
                  title="Copy full order ID"
                >
                  {copied ? (
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-500 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  
                  {/* Tooltip - hidden on mobile */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block">
                    {copied ? 'Copied!' : 'Copy ID'}
                  </div>
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(order.paid, order.complete)}`}>
                {getStatusText(order.paid, order.complete)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right sm:ml-4">
            <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">
              ₹{order.pricepaid.toLocaleString('en-IN')}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Quick preview when collapsed */}
        {!isExpanded && order.orderItems.length > 0 && (
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
            <span className="truncate pr-2">
              {order.orderItems[0].product?.pname || order.orderItems[0].yarnAccessory?.name || 'Item'}
              {order.orderItems.length > 1 && ` and ${order.orderItems.length - 1} more item${order.orderItems.length > 2 ? 's' : ''}`}
            </span>
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {isExpanded && (
          <div className="flex justify-end">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4 sm:p-6">
            <h4 className="text-sm sm:text-md font-semibold text-gray-900 mb-4">Order Items</h4>
            <div className="space-y-3 sm:space-y-4">
              {order.orderItems.map((item) => {
                const isProduct = !!item.product;
                const itemId = isProduct ? item.product?.id : item.yarnAccessory?.id;
                const itemName = isProduct ? item.product?.pname : item.yarnAccessory?.name;
                const itemImage = isProduct ? item.product?.irul : item.yarnAccessory?.imageUrl;
                const itemPrice = isProduct ? item.product?.discountedPrice : item.yarnAccessory?.discountedPrice;
                const itemOriginalPrice = isProduct ? item.product?.originalPrice : item.yarnAccessory?.originalPrice;
                const itemBrand = isProduct ? item.product?.brand?.name : null;
                const itemColor = isProduct ? item.product?.color : null;
                const itemWeight = isProduct ? item.product?.weight_g : null;

                return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product image */}
                    <div className="flex-shrink-0">
                      <Suspense fallback={
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      }>
                        {itemId && imageErrors.has(itemId) ? (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        ) : itemImage ? (
                          <Image
                            src={itemImage}
                            alt={itemName || 'Item'}
                            width={64}
                            height={64}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                            onError={() => itemId && handleImageError(itemId)}
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Wq5wix8qNn8pAuFXv5T2oTKnhQEWUBJVYFCdM9Jcfea7nAdNpzYdFHqFhqwHKCJ0qn/yyMVeRtGwFRPTrr4KQ="
                          />
                        ) : null}
                      </Suspense>
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-1 text-sm sm:text-base truncate">
                            {itemName || 'Item'}
                          </h5>
                          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                            {itemBrand && <p>Brand: {itemBrand}</p>}
                            <div className="flex flex-wrap gap-4 text-xs">
                              {itemColor && <span>Color: {itemColor}</span>}
                              {itemWeight && <span>Weight: {itemWeight}g</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:ml-4 flex-shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-gray-900">
                            ₹{(itemPrice || 0).toLocaleString('en-IN')}
                          </div>
                          {itemOriginalPrice && itemPrice && itemOriginalPrice !== itemPrice && (
                            <div className="text-xs sm:text-sm text-gray-500 line-through">
                              ₹{itemOriginalPrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end space-y-2 sm:space-y-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-600">Qty:</span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm text-gray-600">Subtotal:</div>
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">
                            ₹{((itemPrice || 0) * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Order summary */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-semibold text-gray-900">Total Paid:</span>
                <span className="text-xl sm:text-2xl font-bold text-green-600">
                  ₹{order.pricepaid.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}