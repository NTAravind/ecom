'use client';

import { Product, User } from '@/app/generated/prisma';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Edit3, Minus, Plus, X, UserIcon, MapPin, Phone, ShoppingBag, CreditCard, Truck, ServerIcon, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { debounce } from 'lodash';
import { ErrorBoundary } from 'react-error-boundary';
import DeliveryModeSelector from './del';
import { createUser, updateUser } from './action';
import ProductCart from '@/app/store/store';
import { fcurrency } from '@/utils/utils';

// Lazy load AlertDialog
const AlertDialogLazy = lazy(() =>
  import('@/components/ui/alert-dialog').then((mod) => ({
    default: ({ children, ...props }: any) => <AlertDialog {...props}>{children}</AlertDialog>,
  }))
);

// Dynamic import for Razorpay script
const RazorpayScript = dynamic(() => Promise.resolve(() => null), { ssr: false });

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UserData {
  us: User | null;
  phone: string;
}

interface AlertState {
  isOpen: boolean;
  title: string;
  description: string;
  type: 'success' | 'error' | 'warning';
  onConfirm?: () => void;
  showCancel?: boolean;
}

// Error Boundary Fallback
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-red-800 font-semibold">Something went wrong</h2>
      <p className="text-red-600">{error.message}</p>
      <Button onClick={resetErrorBoundary} className="mt-2">
        Try Again
      </Button>
    </div>
  );
}

function CheckoutContent({ user }: { user: UserData }) {
  const [isEditing, setIsEditing] = useState(!user.us?.name || !user.us?.Address || !user.us?.pincode);
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [deliveryMode, setDeliveryMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentUser(user);
    if (!user.us?.name || !user.us?.Address || !user.us?.pincode) {
      setIsEditing(true);
    }
  }, [user]);

  const showAlert = useCallback(
    (title: string, description: string, type: 'success' | 'error' | 'warning' = 'success', onConfirm?: () => void, showCancel = false) => {
      setAlertState({ isOpen: true, title, description, type, onConfirm, showCancel });
    },
    []
  );

  const handleFormSuccess = useCallback(
    (updatedUser: User) => {
      setCurrentUser({ ...currentUser, us: updatedUser });
      if (updatedUser.name && updatedUser.Address && updatedUser.pincode) {
        setIsEditing(false);
      }
    },
    [currentUser]
  );

  if (!isClient) {
    return <CheckoutSkeleton />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-xl">
                        {deliveryMode ? 'Delivery Information' : 'Pickup Information'}
                      </CardTitle>
                    </div>
                    {user.us?.name && user.us?.Address && user.us?.pincode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <DeliveryModeSelector value={deliveryMode} onChange={setDeliveryMode} />
                  <input type="hidden" name="delivered" value={deliveryMode.toString()} />
                  {isEditing ? (
                    <CheckoutForm user={currentUser} onSuccess={handleFormSuccess} delivery={deliveryMode} />
                  ) : (
                    <UserDetails user={currentUser} deliveryMode={deliveryMode} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <OrderSummary user={currentUser} showAlert={showAlert} del={deliveryMode} />
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <AlertDialogLazy open={alertState.isOpen} onOpenChange={(open) => setAlertState((prev) => ({ ...prev, isOpen: open }))}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                <AlertDialogDescription>{alertState.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {alertState.showCancel && <AlertDialogCancel>Cancel</AlertDialogCancel>}
                <AlertDialogAction
                  onClick={() => {
                    alertState.onConfirm?.();
                    setAlertState((prev) => ({ ...prev, isOpen: false }));
                  }}
                >
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogLazy>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckoutForm = memo(function CheckoutForm({
  user,
  onSuccess,
  delivery,
}: {
  user: UserData;
  onSuccess: (updatedUser: User) => void;
  delivery: boolean;
}) {
  const [state, action, isPending] = useActionState(user.us ? updateUser : createUser, {
    success: false,
    message: '',
    user: null,
  });

  useEffect(() => {
    if (state.success && state.user) {
      onSuccess(state.user);
    }
  }, [state.success, state.user, onSuccess]);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={user.us?.name || ''}
            className="mt-1"
            placeholder="Enter your full name"
            required
            pattern="[A-Za-z\s]{2,50}"
            title="Name must be 2-50 characters and contain only letters and spaces"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            defaultValue={user.us?.Address || ''}
            className="mt-1"
            placeholder="Enter your complete address"
            required
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">Required for both delivery and pickup orders</p>
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
            Pincode <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="pincode"
            id="pincode"
            defaultValue={user.us?.pincode || ''}
            className="mt-1"
            placeholder="Enter your pincode"
            required
            pattern="\d{6}"
            title="Pincode must be exactly 6 digits"
          />
          <p className="text-xs text-gray-500 mt-1">Required for both delivery and pickup orders</p>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={user.phone}
            className="mt-1 bg-gray-50"
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6">
          {isPending ? 'Saving...' : user.us ? 'Update Details' : 'Save Details'}
        </Button>
        {user.us && (
          <Button type="button" variant="outline" onClick={() => onSuccess(user.us!)}>
            Cancel
          </Button>
        )}
      </div>

      {state.message && (
        <div
          className={`p-3 rounded-md text-sm ${
            state.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  );
});

const UserDetails = memo(function UserDetails({ user, deliveryMode }: { user: UserData; deliveryMode: boolean }) {
  if (!user.us) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <UserIcon className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium text-gray-900">{user.us.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <MapPin className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Address</p>
          <p className="font-medium text-gray-900">{user.us.Address}</p>
          <p className="font-medium text-gray-700">Pincode: {user.us.pincode}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <Phone className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-sm text-gray-600">Phone Number</p>
          <p className="font-medium text-gray-900">{user.phone}</p>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          deliveryMode ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}
      >
        {deliveryMode ? (
          <Truck className="h-5 w-5 text-green-600" />
        ) : (
          <ShoppingBag className="h-5 w-5 text-blue-600" />
        )}
        <div>
          <p className={`text-sm font-medium ${deliveryMode ? 'text-green-800' : 'text-blue-800'}`}>
            {deliveryMode ? 'Delivery Mode Selected' : 'Pickup Mode Selected'}
          </p>
          <p className={`text-xs ${deliveryMode ? 'text-green-700' : 'text-blue-700'}`}>
            {deliveryMode ? 'Your order will be delivered to the above address' : 'You can collect your order from our store'}
          </p>
        </div>
      </div>
    </div>
  );
});

const OrderSummary = memo(function OrderSummary({
  user,
  showAlert,
  del,
}: {
  user: UserData;
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void;
  del: boolean;
}) {
  const { cartItems, SetItemQuantity, RemoveProduct, getBasketCount, getTotalPrice } = ProductCart();
  const itemCount = getBasketCount();

  const debouncedSetQuantity = useCallback(
    debounce((id: string, qty: number) => {
      SetItemQuantity(id, qty);
    }, 300),
    [SetItemQuantity]
  );

  return (
    <Card className="shadow-sm border-0 bg-white sticky top-4">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-xl">Your Order</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {cartItems.map((item) => (
                <ProductCard
                  key={item.item.id}
                  item={item}
                  onUpdateQuantity={debouncedSetQuantity}
                  onRemove={RemoveProduct}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <PriceBreakdown user={user} deliveryMode={del} />
              <PurchaseButton user={user} showAlert={showAlert} del={del} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

const PriceBreakdown = memo(function PriceBreakdown({ user, deliveryMode }: { user: UserData; deliveryMode: boolean }) {
  const { getTotalPrice } = ProductCart();
  const subtotal = getTotalPrice();
  const deliveryCharge = useMemo(() => (deliveryMode && subtotal <= 2000 ? 60 : 0), [deliveryMode, subtotal]);
  const total = subtotal + deliveryCharge + 4;
  const isBulkOrder = subtotal > 10000;
  const isFreeDelivery = deliveryMode && subtotal > 2000;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">{fcurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          <Truck className="h-4 w-4" />
          {deliveryMode ? 'Delivery Charge:' : 'Pickup (No Delivery):'}
        </span>
        <span className={`font-medium ${isFreeDelivery ? 'text-green-600' : ''}`}>
          {deliveryMode ? (isFreeDelivery ? 'Free' : fcurrency(deliveryCharge)) : 'Free'}
        </span>
      </div>

      {isFreeDelivery && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Free Delivery Applied!</span>
          </div>
          <p className="text-xs text-green-700 mt-1">Your order qualifies for free delivery (cart value above ₹2,000)</p>
        </div>
      )}

      {deliveryMode && !isFreeDelivery && subtotal < 2000 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Add {fcurrency(2000 - subtotal)} for free delivery</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">Get free delivery on orders above ₹2,000</p>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          <ServerIcon className="h-4 w-4" />
          Taxes:
        </span>
        <span className="font-medium">{fcurrency(4)}</span>
      </div>

      {isBulkOrder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Bulk Order Detected</span>
            <Link href="https://wa.link/132fuh" className="text-orange-600 hover:text-orange-700">
              Contact us
            </Link>
          </div>
          <p className="text-xs text-orange-700 mt-1">Orders above ₹10,000 require bulk order processing</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className={`${isBulkOrder ? 'text-orange-600' : 'text-blue-600'}`}>{fcurrency(total)}</span>
        </div>
      </div>
    </div>
  );
});

const ProductCard = memo(function ProductCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: { item: Product; qty: number };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      if (newQuantity <= 0) {
        onRemove(item.item.id);
      } else {
        onUpdateQuantity(item.item.id, newQuantity);
      }
    },
    [item.item.id, onUpdateQuantity, onRemove]
  );

  const handleIncrement = useCallback(() => handleQuantityChange(item.qty + 1), [handleQuantityChange, item.qty]);
  const handleDecrement = useCallback(() => handleQuantityChange(item.qty - 1), [handleQuantityChange, item.qty]);
  const handleRemove = useCallback(() => onRemove(item.item.id), [onRemove, item.item.id]);

  return (
    <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
        {item.item.irul ? (
          <Image
            src={item.item.irul}
            alt={item.item.pname || 'Product'}
            fill
            sizes="56px"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLFhiQQehonbkicnzB/V+YmN2bj3KzLIlk/wDi0k7rk9hm"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">{item.item.pname?.charAt(0)?.toUpperCase() || 'P'}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 truncate pr-2">{item.item.pname}</h4>
          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 flex-shrink-0"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center bg-white rounded-full border border-gray-200 p-1">
            <button
              onClick={handleDecrement}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              disabled={item.qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3 text-gray-600" />
            </button>
            <span className="text-sm font-medium px-3 min-w-[30px] text-center">{item.qty}</span>
            <button
              onClick={handleIncrement}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3 text-gray-600" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              {fcurrency(item.item.discountedPrice)} × {item.qty}
            </p>
            <p className="text-sm font-semibold text-gray-900">{fcurrency(item.item.discountedPrice * item.qty)}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

function PurchaseButton({
  user,
  showAlert,
  del,
}: {
  user: UserData;
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void;
  del: boolean;
}) {
  const [isPending, setPending] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false); // New state for order loading
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { cartItems, getTotalPrice, ClearBasket } = ProductCart();
  const router = useRouter();
  const subtotal = getTotalPrice();
  const deliveryCharge = useMemo(() => (del && subtotal <= 2000 ? 60 : 0), [del, subtotal]);
  const totalAmount = subtotal + deliveryCharge + 4;

  useEffect(() => {
    if (!scriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        showAlert('Payment Script Failed', 'Failed to load payment system. Please try again later.', 'error');
        setScriptLoaded(false);
      };
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [scriptLoaded, showAlert]);

  const generateOrderText = useCallback(() => {
    const orderItems = cartItems
      .map((item) => `${item.item.pname} - Qty: ${item.qty} - Price: ${fcurrency(item.item.discountedPrice * item.qty)}`)
      .join('\n');

    return `🛒 *Bulk Order Request*

📋 *Order Details:*
${orderItems}

💰 *Order Summary:*
Subtotal: ${fcurrency(subtotal)}
${del ? `Delivery Charge: ${deliveryCharge === 0 ? 'Free (₹2000+ order)' : fcurrency(deliveryCharge)}` : 'Pickup (No Delivery): Free'}
Taxes: ${fcurrency(4)}
*Total: ${fcurrency(totalAmount)}*

👤 *Customer Details:*
Name: ${user.us?.name || 'Not provided'}
Phone: ${user.phone}
${del ? `Address: ${user.us?.Address || 'Not provided'}\nPincode: ${user.us?.pincode || 'Not provided'}` : 'Order Type: Pickup'}

Please process this bulk order. Thank you!`;
  }, [cartItems, subtotal, deliveryCharge, del, user]);

  const copyOrderDetails = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateOrderText());
      showAlert('Order Details Copied!', 'Order details have been copied to clipboard. You can now paste them in WhatsApp.', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showAlert('Copy Failed', 'Failed to copy order details. Please manually copy the text from the dialog.', 'error');
    }
  }, [generateOrderText, showAlert]);

  const openWhatsApp = useCallback(() => {
    const orderText = generateOrderText();
    const whatsappUrl = `https://wa.link/132fuh?text=${encodeURIComponent(orderText)}`;
    window.open(whatsappUrl, '_blank');
  }, [generateOrderText]);

  const handlePayment = useCallback(async () => {
    if (!user.us?.name || !user.us?.Address || !user.us?.pincode) {
      showAlert(
        'Missing Required Information',
        'Please add your name, address, and pincode to proceed with the order.',
        'warning'
      );
      return;
    }

    if (subtotal > 10000) {
      setShowBulkDialog(true);
      return;
    }

    if (!scriptLoaded || !window.Razorpay) {
      showAlert('Payment System Loading', 'Payment system is still loading. Please try again in a moment.', 'warning');
      return;
    }

    setPending(true);
    setIsLoadingOrder(true); // Set loading state for order creation

    try {
      const orderItems = cartItems.map((cartItem) => ({
        productId: cartItem.item.id,
        qty: cartItem.qty,
      }));

      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        body: JSON.stringify({
          phoneno: user.phone,
          cartitems: orderItems,
          pincode: user.us?.pincode || null,
          delivery: del,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      setIsLoadingOrder(false); // Clear loading state after response

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.orderId) {
        throw new Error(data.error || 'Failed to create order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORKEY,
        amount: totalAmount * 100,
        currency: 'INR',
        name: 'Roshan Fancy Store',
        description: del ? 'Delivery Order Payment' : 'Pickup Order Payment',
        handler: async function (response: any) {
          setIsLoadingOrder(true); // Set loading state for order completion
          try {
            const completeOrderRes = await fetch('/api/razorpay/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.us?.id,
                cartItems,
                pricepaid: totalAmount,
                paymentid: response.razorpay_payment_id,
                order_id: data.orderId,
                delivery: del,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            setIsLoadingOrder(false); // Clear loading state after response

            if (!completeOrderRes.ok) {
              throw new Error(`HTTP error! status: ${completeOrderRes.status}`);
            }

            const orderResult = await completeOrderRes.json();
            if (orderResult.success) {
              showAlert(
                'Order Placed Successfully!',
                `Your ${del ? 'delivery' : 'pickup'} order has been placed successfully and you will receive a confirmation shortly.`,
                'success',
                () => {
                  ClearBasket();
                  router.push('/orders/');
                }
              );
            } else {
              showAlert('Order Processing Issue', orderResult.error || 'Order processing failed. Please contact support for assistance.', 'error');
            }
          } catch (completeErr) {
            console.error('Order completion error:', completeErr);
            setIsLoadingOrder(false); // Clear loading state on error
            showAlert(
              'Order Processing Error',
              'Payment successful but order completion failed. Please contact support if money was deducted from your account.',
              'error'
            );
          }
        },
        order_id: data.orderId,
        prefill: {
          name: user?.us?.name || '',
          contact: user.phone,
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        setIsLoadingOrder(false); // Clear loading state on payment failure
        showAlert('Payment Failed', `Payment failed: ${response.error.description}. Please try again.`, 'error');
      });
      rzp1.open();
    } catch (err) {
      console.error('Payment failed:', err);
      setIsLoadingOrder(false); // Clear loading state on error
      showAlert('Payment Failed', 'Failed to initiate payment. Please check your internet connection and try again.', 'error');
    } finally {
      setPending(false);
    }
  }, [del, user, subtotal, deliveryCharge, cartItems, scriptLoaded, showAlert, ClearBasket, router]);

  const canProceed = useMemo(
    () => user.us?.name && user.us?.Address && user.us?.pincode && cartItems.length > 0,
    [user.us?.name, user.us?.Address, user.us?.pincode, cartItems.length]
  );

  const isBulkOrder = subtotal > 10000;

  const getButtonText = useCallback(() => {
    if (isPending || isLoadingOrder) return 'Processing...';
    if (isBulkOrder) return 'Contact for Bulk Order';
    if (!canProceed) return 'Complete Required Details';
    return `Pay ${fcurrency(totalAmount)}`;
  }, [isPending, isLoadingOrder, isBulkOrder, canProceed, totalAmount]);

  const getHelpText = useCallback(() => {
    if (!canProceed) return 'Please complete all required details to proceed';
    if (isBulkOrder) return 'Order value above ₹10,000 requires bulk order processing';
    return null;
  }, [canProceed, isBulkOrder]);

  return (
    <>
      <RazorpayScript />
      <div className="flex flex-col items-center justify-center">
        {scriptLoaded ? (
          <Button
            onClick={handlePayment}
            disabled={isPending || !canProceed || isLoadingOrder}
            className={`w-full font-semibold py-3 flex items-center justify-center gap-2 ${
              isBulkOrder ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-label={getButtonText()}
          >
            {isLoadingOrder ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              getButtonText()
            )}
          </Button>
        ) : (
          <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <p className="text-gray-500 text-sm ml-2">Loading Payment...</p>
          </div>
        )}
        {getHelpText() && (
          <p className={`text-sm mt-2 text-center ${isBulkOrder ? 'text-orange-600' : 'text-gray-500'}`}>{getHelpText()}</p>
        )}
      </div>

      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Bulk Order Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your order value is {fcurrency(subtotal)}, which exceeds our ₹10,000 online checkout limit. Please forward your order details to WhatsApp for personalized bulk order processing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Order Details:
              </h4>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.item.pname}</p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.qty} × {fcurrency(item.item.discountedPrice)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">{fcurrency(item.item.discountedPrice * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{fcurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{del ? 'Delivery Charge:' : 'Pickup (No Delivery):'}</span>
                  <span className={`font-medium ${deliveryCharge === 0 && del ? 'text-green-600' : ''}`}>
                    {del ? (deliveryCharge === 0 ? 'Free (₹2000+ order)' : fcurrency(deliveryCharge)) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes:</span>
                  <span className="font-medium">{fcurrency(4)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">{fcurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                <UserIcon className="h-4 w-4" />
                Customer Details:
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <span className="font-medium">Name:</span> {user.us?.name || 'Not provided'}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {user.phone}
                </p>
                <p>
                  <span className="font-medium">Address:</span> {user.us?.Address || 'Not provided'}
                </p>
                <p>
                  <span className="font-medium">Pincode:</span> {user.us?.pincode || 'Not provided'}
                </p>
                <p>
                  <span className="font-medium">Order Type:</span> {del ? 'Delivery' : 'Pickup'}
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button onClick={copyOrderDetails} variant="outline" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Copy Order Details
            </Button>
            <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Send to WhatsApp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



export default CheckoutContent;