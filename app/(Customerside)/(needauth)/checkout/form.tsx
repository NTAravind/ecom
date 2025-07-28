'use client'
import { Product, User } from "@/app/generated/prisma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DeliveryModeSelector from "./del";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createUser, updateUser } from "./action";
import { useEffect, useState, useMemo, useCallback, memo, lazy, Suspense, useTransition } from "react";
import { useActionState } from "react";
import ProductCart from "@/app/store/store";
import { fcurrency } from "@/utils/utils";
import { Minus, Plus, ServerIcon, X } from "lucide-react";
import { Edit3, User as UserIcon, MapPin, Phone, ShoppingBag, CreditCard, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";


const AlertDialogLazy = lazy(() => 
  import("@/components/ui/alert-dialog").then(mod => ({
    default: ({ children, ...props }: any) => (
      <AlertDialog {...props}>
        {children}
      </AlertDialog>
    )
  }))
);


const DELIVERY_CONSTANTS = {
  FREE_DELIVERY_THRESHOLD: 2000,
  DELIVERY_CHARGE: 60,
  TAX_AMOUNT: 4,
  BULK_ORDER_THRESHOLD: 10000,
} as const;

const RAZORPAY_CONFIG = {
  script_url: 'https://checkout.razorpay.com/v1/checkout.js',
  public_key: process.env.RAZORPAY_KEY_PUBLIC, 
  currency: 'INR',
  company_name: 'Roshan Fancy Store',
} as const;

// Global Razorpay interface
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

interface CartItem {
  item: Product;
  qty: number;
}

interface OrderCalculations {
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  isFreeDelivery: boolean;
  isBulkOrder: boolean;
}

export default function CheckoutContent({ user }: { user: UserData }) {
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [deliveryMode, setDeliveryMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'success'
  });

  // Memoized validation logic
  const validationRules = useMemo(() => ({
    isValidForDelivery: (userData: UserData) => 
      !!(userData.us?.name && userData.us?.Address && userData.us?.pincode),
    isValidForPickup: (userData: UserData) => 
      !!(userData.us?.name),
    getRequiredFields: (isDelivery: boolean) => 
      isDelivery ? ['name', 'address', 'pincode'] : ['name']
  }), []);

  // Calculate initial editing state
  const getInitialEditingState = useCallback((userData: UserData, isDelivery: boolean) => {
    if (!userData.us) return true;
    
    return isDelivery 
      ? !validationRules.isValidForDelivery(userData)
      : !validationRules.isValidForPickup(userData);
  }, [validationRules]);

  const [isEditing, setIsEditing] = useState(() => 
    getInitialEditingState(user, true)
  );
  
  // Client-side hydration
  useEffect(() => {
    startTransition(() => {
      setIsClient(true);
    });
  }, []);

  // Update editing state when delivery mode or user changes
  useEffect(() => {
    const shouldEdit = getInitialEditingState(currentUser, deliveryMode);
    if (shouldEdit !== isEditing) {
      setIsEditing(shouldEdit);
    }
  }, [deliveryMode, currentUser, getInitialEditingState, isEditing]);

  // Alert function
  const showAlert = useCallback((
    title: string, 
    description: string, 
    type: 'success' | 'error' | 'warning' = 'success', 
    onConfirm?: () => void, 
    showCancel: boolean = false
  ) => {
    setAlertState({
      isOpen: true,
      title,
      description,
      type,
      onConfirm,
      showCancel
    });
  }, []);

  // Form success handler
  const handleFormSuccess = useCallback((updatedUser: User) => {
    startTransition(() => {
      const newUserData = { ...currentUser, us: updatedUser };
      setCurrentUser(newUserData);
      
      const shouldStillEdit = getInitialEditingState(newUserData, deliveryMode);
      setIsEditing(shouldStillEdit);
    });
  }, [currentUser, deliveryMode, getInitialEditingState]);

  // Edit toggle handler
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      const canStopEditing = !getInitialEditingState(currentUser, deliveryMode);
      if (canStopEditing) {
        setIsEditing(false);
      } else {
        const missingFields = validationRules.getRequiredFields(deliveryMode);
        showAlert(
          "Missing Required Information",
          `Please complete: ${missingFields.join(', ')} before proceeding.`,
          "warning"
        );
      }
    } else {
      setIsEditing(true);
    }
  }, [isEditing, currentUser, deliveryMode, getInitialEditingState, validationRules, showAlert]);

  // Loading state
  if (!isClient) {
    return <CheckoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">
                      {deliveryMode ? "Delivery Information" : "Pickup Information"}
                    </CardTitle>
                  </div>
                  {currentUser.us && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEditToggle}
                      className="flex items-center gap-2"
                      disabled={isPending}
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <DeliveryModeSelector value={deliveryMode} onChange={setDeliveryMode} />
                
                {isEditing ? (
                  <Suspense fallback={<FormSkeleton />}>
                    <CheckoutForm 
                      user={currentUser} 
                      onSuccess={handleFormSuccess} 
                      delivery={deliveryMode}
                    />
                  </Suspense>
                ) : (
                  <UserDetails user={currentUser} deliveryMode={deliveryMode} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Suspense fallback={<OrderSummarySkeleton />}>
              <OrderSummary 
                user={currentUser} 
                showAlert={showAlert} 
                deliveryMode={deliveryMode}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <AlertDialogLazy 
          open={alertState.isOpen} 
          onOpenChange={(open) => setAlertState(prev => ({ ...prev, isOpen: open }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {alertState.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {alertState.showCancel && (
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              )}
              <AlertDialogAction onClick={() => {
                alertState.onConfirm?.();
                setAlertState(prev => ({ ...prev, isOpen: false }));
              }}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogLazy>
      </Suspense>
    </div>
  );
}

// Skeleton components
const CheckoutSkeleton = memo(() => (
  <div className="min-h-screen bg-gray-50 py-8" role="status" aria-label="Loading checkout">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <OrderSummarySkeleton />
        </div>
      </div>
    </div>
  </div>
));

const FormSkeleton = memo(() => (
  <div className="space-y-4 mt-6" role="status" aria-label="Loading form">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    ))}
  </div>
));

const OrderSummarySkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm border p-6" role="status" aria-label="Loading order summary">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
    <div className="space-y-3">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  </div>
));

// Checkout form component
const CheckoutForm = memo(function CheckoutForm({ 
  user, 
  onSuccess, 
  delivery 
}: { 
  user: UserData; 
  onSuccess: (updatedUser: User) => void; 
  delivery: boolean;
}) {
  const [state, action, isPending] = useActionState(
    user.us ? updateUser : createUser,
    { success: false, message: "", user: null }
  );

  // Handle successful form submission
  useEffect(() => {
    if (state.success && state.user) {
      const timer = setTimeout(() => {
        onSuccess(state.user);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [state.success, state.user, onSuccess]);

  const handleCancel = useCallback(() => {
    if (user.us) {
      onSuccess(user.us);
    }
  }, [user.us, onSuccess]);

  return (
    <form action={action} className="space-y-6 mt-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={user.us?.name || ""}
            className="mt-1"
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            {delivery ? "Delivery Address *" : "Address (Optional)"}
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            defaultValue={user.us?.Address || ""}
            className={`mt-1 ${!delivery ? 'bg-gray-50' : ''}`}
            placeholder={delivery ? "Enter your complete address" : "Address for reference"}
            required={delivery}
            disabled={!delivery}
            autoComplete="street-address"
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
            {delivery ? "Pincode *" : "Pincode (Optional)"}
          </Label>
          <Input 
            type="number" 
            name="pincode" 
            id="pincode"
            defaultValue={user.us?.pincode || ""}
            className={`mt-1 ${!delivery ? 'bg-gray-50' : ''}`}
            placeholder={delivery ? "Enter your pincode" : "Pincode for reference"}
            required={delivery}
            disabled={!delivery}
            autoComplete="postal-code"
            min="100000"
            max="999999"
          />
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
            autoComplete="tel"
          />
        </div>
      </div>
 
      <div className="flex items-center gap-3">
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          {isPending ? "Saving..." : user.us ? "Update Details" : "Save Details"}
        </Button>
        
        {user.us && (
          <Button 
            type="button" 
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>

      {state.message && (
        <div className={`p-3 rounded-md text-sm ${
          state.success 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {state.message}
        </div>
      )}

      <input type="hidden" name="delivered" value={delivery.toString()} />
    </form>
  );
});

// User details display component
const UserDetails = memo(function UserDetails({ 
  user, 
  deliveryMode 
}: { 
  user: UserData; 
  deliveryMode: boolean 
}) {
  if (!user.us) return null;

  const userDetailsItems = useMemo(() => [
    {
      icon: UserIcon,
      label: "Name",
      value: user.us.name,
      show: true
    },
    {
      icon: MapPin,
      label: "Delivery Address",
      value: user.us.Address,
      extraValue: user.us.pincode ? `Pincode: ${user.us.pincode}` : null,
      show: deliveryMode && user.us.Address
    },
    {
      icon: Phone,
      label: "Phone Number",
      value: user.phone,
      show: true
    }
  ], [user.us, user.phone, deliveryMode]);

  return (
    <div className="space-y-4 mt-6">
      {userDetailsItems.map((item, index) => {
        if (!item.show) return null;
        
        const IconComponent = item.icon;
        return (
          <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <IconComponent className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="font-medium text-gray-900">{item.value}</p>
              {item.extraValue && (
                <p className="font-medium text-gray-700 text-sm">{item.extraValue}</p>
              )}
            </div>
          </div>
        );
      })}

      {!deliveryMode && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">Pickup Mode Selected</p>
            <p className="text-xs text-blue-700">You can collect your order from our store</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Order summary component
const OrderSummary = memo(function OrderSummary({
  user, 
  showAlert, 
  deliveryMode
}: {
  user: UserData; 
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void; 
  deliveryMode: boolean;
}) {
  const { cartItems, SetItemQuantity, RemoveProduct, getBasketCount, getTotalPrice } = ProductCart();
  
  // Memoized order calculations
  const orderCalculations: OrderCalculations = useMemo(() => {
    const itemCount = getBasketCount();
    const subtotal = getTotalPrice();
    const deliveryCharge = !deliveryMode ? 0 : 
      subtotal > DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CONSTANTS.DELIVERY_CHARGE;
    const total = subtotal + deliveryCharge + DELIVERY_CONSTANTS.TAX_AMOUNT;
    
    return {
      itemCount,
      subtotal,
      deliveryCharge,
      total,
      isFreeDelivery: deliveryMode && subtotal > DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD,
      isBulkOrder: subtotal > DELIVERY_CONSTANTS.BULK_ORDER_THRESHOLD
    };
  }, [cartItems, deliveryMode, getBasketCount, getTotalPrice]);
  
  return (
    <Card className="shadow-sm border-0 bg-white sticky top-4">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-xl">Your Order</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {orderCalculations.itemCount} {orderCalculations.itemCount === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {cartItems.length === 0 ? (
          <EmptyCartMessage />
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
              {cartItems.map((item) => (
                <ProductCard 
                  key={item.item.id} 
                  item={item} 
                  onUpdateQuantity={SetItemQuantity}
                  onRemove={RemoveProduct}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <PriceBreakdown 
                calculations={orderCalculations}
                deliveryMode={deliveryMode} 
              />
              <PurchaseButton 
                user={user} 
                showAlert={showAlert} 
                deliveryMode={deliveryMode}
                calculations={orderCalculations}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

// Empty cart message
const EmptyCartMessage = memo(() => (
  <div className="text-center py-8">
    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <p className="text-gray-500">Your cart is empty</p>
    <Link 
      href="/products" 
      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
    >
      Continue Shopping
    </Link>
  </div>
));

// Price breakdown component
const PriceBreakdown = memo(function PriceBreakdown({
  calculations,
  deliveryMode
}: {
  calculations: OrderCalculations;
  deliveryMode: boolean;
}) {
  const { subtotal, deliveryCharge, total, isFreeDelivery, isBulkOrder } = calculations;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">{fcurrency(subtotal)}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          <Truck className="h-4 w-4" />
          {deliveryMode ? "Delivery Charge:" : "Pickup (No Delivery):"}
        </span>
        <span className={`font-medium ${isFreeDelivery ? 'text-green-600' : ''}`}>
          {deliveryMode 
            ? (isFreeDelivery ? "Free" : fcurrency(deliveryCharge))
            : "Free"
          }
        </span>
      </div>

      {/* Free Delivery Message */}
      {isFreeDelivery && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Free Delivery Applied!</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your order qualifies for free delivery (cart value above ₹{DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD.toLocaleString()}) 
          </p>
        </div>
      )}

      {/* Show delivery threshold for orders below threshold */}
      {deliveryMode && !isFreeDelivery && subtotal < DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Add {fcurrency(DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD - subtotal)} for free delivery
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Get free delivery on orders above ₹{DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD.toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
         <ServerIcon className="h-4 w-4" />
          Taxes: 
        </span>
        <span className="font-medium">
          {fcurrency(DELIVERY_CONSTANTS.TAX_AMOUNT)}
        </span>
      </div>
      
      {/* Bulk Order Warning */}
      {isBulkOrder && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 my-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Bulk Order Detected</span>
            <Link 
              href="https://wa.link/132fuh" 
              className="text-orange-600 hover:text-orange-700 ml-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </Link>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Orders above ₹{DELIVERY_CONSTANTS.BULK_ORDER_THRESHOLD.toLocaleString()} require bulk order processing
          </p>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className={`${isBulkOrder ? 'text-orange-600' : 'text-blue-600'}`}>
            {fcurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
});

// Product card component
const ProductCard = memo(function ProductCard({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem; 
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.item.id);
    } else {
      onUpdateQuantity(item.item.id, newQuantity);
    }
  }, [item.item.id, onUpdateQuantity, onRemove]);

  const handleIncrement = useCallback(() => {
    handleQuantityChange(item.qty + 1);
  }, [handleQuantityChange, item.qty]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(item.qty - 1);
  }, [handleQuantityChange, item.qty]);

  const handleRemove = useCallback(() => {
    onRemove(item.item.id);
  }, [onRemove, item.item.id]);

  // Memoized calculations
  const totalPrice = useMemo(() => 
    item.item.discountedPrice * item.qty, 
    [item.item.discountedPrice, item.qty]
  );

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
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {item.item.pname?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
            {item.item.pname}
          </h4>
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
            
            <span className="text-sm font-medium px-3 min-w-[30px] text-center">
              {item.qty}
            </span>
            
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
            <p className="text-sm font-semibold text-gray-900">
              {fcurrency(totalPrice)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Purchase button component
function PurchaseButton({ 
  user, 
  showAlert, 
  deliveryMode,
  calculations
}: { 
  user: UserData; 
  showAlert: (title: string, description: string, type?: 'success' | 'error' | 'warning', onConfirm?: () => void, showCancel?: boolean) => void; 
  deliveryMode: boolean;
  calculations: OrderCalculations;
}) {
  const [isPending, setPending] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  
  const { cartItems, ClearBasket } = ProductCart();
  const router = useRouter();

  // Lazy load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (scriptLoaded && window.Razorpay) {
        resolve(true);
        return;
      }

      if (document.querySelector('script[src*="razorpay"]')) {
        // Script already exists, wait for it to load
        const checkLoaded = () => {
          if (window.Razorpay) {
            setScriptLoaded(true);
            resolve(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement('script');
      script.src = RAZORPAY_CONFIG.script_url;
      script.async = true;
      
      script.onload = () => {
        setScriptLoaded(true);
        setScriptError(false);
        resolve(true);
      };
      
      script.onerror = () => {
        setScriptError(true);
        resolve(false);
      };
      
      document.head.appendChild(script);
    });
  }, [scriptLoaded]);

  // Validation logic
  const validationState = useMemo(() => {
    const hasRequiredInfo = deliveryMode 
      ? !!(user.us?.name && user.us?.Address && user.us?.pincode)
      : !!(user.us?.name);

    const canProceed = cartItems.length > 0 && hasRequiredInfo;
    
    const getMissingFields = () => {
      if (deliveryMode) {
        const missing = [];
        if (!user.us?.name) missing.push('name');
        if (!user.us?.Address) missing.push('address');
        if (!user.us?.pincode) missing.push('pincode');
        return missing;
      } else {
        return !user.us?.name ? ['name'] : [];
      }
    };

    return {
      canProceed,
      hasRequiredInfo,
      missingFields: getMissingFields()
    };
  }, [deliveryMode, user.us, cartItems.length]);

  // Generate order text for bulk orders
  const generateOrderText = useCallback(() => {
    const orderItems = cartItems.map(item => 
      `${item.item.pname} - Qty: ${item.qty} - Price: ${fcurrency(item.item.discountedPrice * item.qty)}`
    ).join('\n');
    
    const { total, subtotal, deliveryCharge } = calculations;
    
    return `🛒 *Bulk Order Request*

📋 *Order Details:*
${orderItems}

💰 *Order Summary:*
Subtotal: ${fcurrency(subtotal)}
${deliveryMode ? `Delivery Charge: ${deliveryCharge === 0 && subtotal > DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD ? 'Free (₹2000+ order)' : fcurrency(deliveryCharge)}` : 'Pickup (No Delivery): Free'}
Taxes: ${fcurrency(DELIVERY_CONSTANTS.TAX_AMOUNT)}
*Total: ${fcurrency(total)}*

👤 *Customer Details:*
Name: ${user.us?.name || 'Not provided'}
Phone: ${user.phone}
${deliveryMode ? `Address: ${user.us?.Address || 'Not provided'}
Pincode: ${user.us?.pincode || 'Not provided'}` : 'Order Type: Pickup'}

Please process this bulk order. Thank you!`;
  }, [cartItems, calculations, deliveryMode, user]);

  // Bulk order handlers
  const copyOrderDetails = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateOrderText());
      showAlert(
        "Order Details Copied!",
        "Order details have been copied to clipboard. You can now paste them in WhatsApp.",
        "success"
      );
    } catch (err) {
      console.error('Failed to copy:', err);
      showAlert(
        "Copy Failed",
        "Failed to copy order details. Please manually copy the text from the dialog.",
        "error"
      );
    }
  }, [generateOrderText, showAlert]);

  const openWhatsApp = useCallback(() => {
    const orderText = generateOrderText();
    const whatsappUrl = `https://wa.link/132fuh?text=${encodeURIComponent(orderText)}`;
    window.open(whatsappUrl, '_blank');
  }, [generateOrderText]);

  // Main payment handler
  const handlePayment = useCallback(async () => {
    // Validation checks
    if (!validationState.canProceed) {
      const missingFieldsText = validationState.missingFields.join(', ');
      showAlert(
        "Missing Information",
        `Please complete the following fields: ${missingFieldsText}`,
        "warning"
      );
      return;
    }

    // Check for bulk order
    if (calculations.isBulkOrder) {
      setShowBulkDialog(true);
      return;
    }

    setPending(true);

    try {
      // Load Razorpay script
      const scriptLoadSuccess = await loadRazorpayScript();
      
      if (!scriptLoadSuccess || scriptError) {
        throw new Error("Failed to load payment system");
      }

      // Transform cart items for API
      const orderItems = cartItems.map(cartItem => ({
        productId: cartItem.item.id,
        qty: cartItem.qty
      }));

      // Create order
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST", 
        body: JSON.stringify({
          phoneno: user.phone, 
          cartitems: orderItems,
          pincode: user.us?.pincode || null,
          delivery: deliveryMode,
        }),  
        headers: { "Content-Type": "application/json" }
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Order creation failed: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      
      if (!orderData.orderId) {
        throw new Error("Invalid order response");
      }

      // Initialize Razorpay
      const razorpayOptions = {
        key: RAZORPAY_CONFIG.public_key,
        amount: calculations.total * 100,
        currency: RAZORPAY_CONFIG.currency,
        name: RAZORPAY_CONFIG.company_name,
        description: deliveryMode ? "Delivery Order Payment" : "Pickup Order Payment",
        order_id: orderData.orderId,
        prefill: {
          name: user?.us?.name || "", 
          contact: user.phone,
        },
        handler: async function(response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            
            if (!verifyResponse.ok) {
              throw new Error("Payment verification request failed");
            }
            
            const verifyData = await verifyResponse.json();
            
            if (!verifyData.success) {
              throw new Error("Payment verification failed");
            }

            // Process delivery
            const deliveryResponse = await fetch('/api/delivery/', {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.us?.id,
                cartItems,
                pricepaid: calculations.total,
                paymentid: response.razorpay_payment_id,
                order_id: orderData.orderId,
                delivery: deliveryMode
              })
            });
            
            if (!deliveryResponse.ok) {
              throw new Error("Order processing failed");
            }

            // Success
            showAlert(
              "Order Placed Successfully!",
              `Your ${deliveryMode ? 'delivery' : 'pickup'} order has been placed successfully and you will receive a confirmation shortly.`,
              "success",
              () => {
                ClearBasket();
                router.push('/orders/');
              }
            );
            
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            showAlert(
              "Payment Processing Issue",
              "There was an issue processing your payment. Please contact support if money was deducted from your account.",
              "error"
            );
          } finally {
            setPending(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPending(false);
          }
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
      
    } catch (err) {
      console.error("Payment error:", err);
      setPending(false);
      
      showAlert(
        "Payment Failed",
        err instanceof Error ? err.message : "Failed to initiate payment. Please try again.",
        "error"
      );
    }
  }, [
    validationState, 
    calculations, 
    loadRazorpayScript, 
    scriptError, 
    cartItems, 
    user, 
    deliveryMode, 
    showAlert, 
    ClearBasket, 
    router
  ]);

  // Button configuration
  const buttonConfig = useMemo(() => {
    if (isPending) {
      return {
        text: "Processing Payment...",
        helpText: null,
        className: "bg-blue-600 hover:bg-blue-700 text-white"
      };
    }
    
    if (calculations.isBulkOrder) {
      return {
        text: "Contact for Bulk Order",
        helpText: `Order value above ₹${DELIVERY_CONSTANTS.BULK_ORDER_THRESHOLD.toLocaleString()} requires bulk order processing`,
        className: "bg-orange-600 hover:bg-orange-700 text-white"
      };
    }
    
    if (!validationState.hasRequiredInfo) {
      const missingText = deliveryMode ? "Add Delivery Details" : "Add Contact Details";
      return {
        text: missingText,
        helpText: `Please complete the following: ${validationState.missingFields.join(', ')}`,
        className: "bg-gray-400 text-white cursor-not-allowed"
      };
    }
    
    return {
      text: `Pay ${fcurrency(calculations.total)}`,
      helpText: null,
      className: "bg-blue-600 hover:bg-blue-700 text-white"
    };
  }, [isPending, calculations, validationState, deliveryMode]);

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <Button 
          onClick={handlePayment} 
          disabled={isPending || !validationState.canProceed}
          className={`w-full font-semibold py-3 ${buttonConfig.className}`}
        >
          {buttonConfig.text}
        </Button>
        
        {buttonConfig.helpText && (
          <p className={`text-sm mt-2 text-center ${
            calculations.isBulkOrder ? 'text-orange-600' : 'text-gray-500'
          }`}>
            {buttonConfig.helpText}
          </p>
        )}

        {scriptError && (
          <p className="text-sm mt-2 text-center text-red-600">
            Payment system failed to load. Please refresh the page.
          </p>
        )}
      </div>

      {/* Bulk Order Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Bulk Order Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your order value is {fcurrency(calculations.subtotal)}, which exceeds our ₹{DELIVERY_CONSTANTS.BULK_ORDER_THRESHOLD.toLocaleString()} online checkout limit. 
              Please forward your order details to WhatsApp for personalized bulk order processing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <BulkOrderDetails 
              cartItems={cartItems}
              calculations={calculations}
              user={user}
              deliveryMode={deliveryMode}
            />
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button 
              onClick={copyOrderDetails}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Copy Order Details
            </Button>
            <Button 
              onClick={openWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Send to WhatsApp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Bulk order details component
const BulkOrderDetails = memo(function BulkOrderDetails({
  cartItems,
  calculations,
  user,
  deliveryMode
}: {
  cartItems: CartItem[];
  calculations: OrderCalculations;
  user: UserData;
  deliveryMode: boolean;
}) {
  return (
    <>
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
                <p className="text-xs text-gray-600">Qty: {item.qty} × {fcurrency(item.item.discountedPrice)}</p>
              </div>
              <p className="font-semibold text-sm">{fcurrency(item.item.discountedPrice * item.qty)}</p>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{fcurrency(calculations.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{deliveryMode ? 'Delivery Charge:' : 'Pickup (No Delivery):'}</span>
            <span className={`font-medium ${calculations.deliveryCharge === 0 && deliveryMode && calculations.subtotal > DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD ? 'text-green-600' : ''}`}>
              {deliveryMode ? (calculations.deliveryCharge === 0 && calculations.subtotal > DELIVERY_CONSTANTS.FREE_DELIVERY_THRESHOLD ? 'Free (₹2000+ order)' : fcurrency(calculations.deliveryCharge)) : 'Free'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Taxes:</span>
            <span className="font-medium">{fcurrency(DELIVERY_CONSTANTS.TAX_AMOUNT)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-orange-600">{fcurrency(calculations.total)}</span>
          </div>
        </div>
      </div>
      
      {/* Customer Details */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
          <UserIcon className="h-4 w-4" />
          Customer Details:
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><span className="font-medium">Name:</span> {user.us?.name || 'Not provided'}</p>
          <p><span className="font-medium">Phone:</span> {user.phone}</p>
          {deliveryMode && (
            <>
              <p><span className="font-medium">Address:</span> {user.us?.Address || 'Not provided'}</p>
              <p><span className="font-medium">Pincode:</span> {user.us?.pincode || 'Not provided'}</p>
            </>
          )}
          <p><span className="font-medium">Order Type:</span> {deliveryMode ? 'Delivery' : 'Pickup'}</p>
        </div>
      </div>
    </>
  );
});