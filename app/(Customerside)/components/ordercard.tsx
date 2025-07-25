'use client';

import { useState , useEffect} from 'react';
// Using inline SVG icons instead of heroicons

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
      product: {
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
    }[];
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  const [client,Setclient] = useState(false)
  useEffect(()=>{Setclient(true)},[])
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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
    e.stopPropagation(); // Prevent card expansion when clicking copy
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
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

  if(!client){return<></>}
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header - Always visible */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-gray-200 rounded transition-colors duration-150 group relative"
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
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {copied ? 'Copied!' : 'Copy ID'}
                  </div>
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paid, order.complete)}`}>
                {getStatusText(order.paid, order.complete)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600 mb-1">
              ₹{order.pricepaid.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-500">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Quick preview when collapsed */}
        {!isExpanded && order.orderItems.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {order.orderItems[0].product.pname}
              {order.orderItems.length > 1 && ` and ${order.orderItems.length - 1} more item${order.orderItems.length > 2 ? 's' : ''}`}
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {isExpanded && (
          <div className="flex justify-end">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Order Items</h4>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.irul}
                        alt={item.product.pname}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.png'; // Fallback image
                        }}
                      />
                    </div>

                    {/* Product details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">
                            {item.product.pname}
                          </h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Brand: {item.product.brand.name}</p>
                            <p>Color: {item.product.color}</p>
                            <p>Weight: {item.product.weight_g}g</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ₹{item.product.discountedPrice.toLocaleString('en-IN')}
                          </div>
                          {item.product.originalPrice !== item.product.discountedPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ₹{item.product.originalPrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Subtotal:</div>
                          <div className="font-semibold text-gray-900">
                            ₹{(item.product.discountedPrice * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Paid:</span>
                <span className="text-2xl font-bold text-green-600">
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