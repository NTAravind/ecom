'use client'
import { Product, User } from "@/app/generated/prisma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createUser, updateUser } from "./action";
import { use, useEffect, useState } from "react";
import { useActionState } from "react";
import ProductCart from "@/app/store/store";
import { fcurrency } from "@/utils/utils";
import { Minus, Plus, X } from "lucide-react";
import { Edit3, User as UserIcon, MapPin, Phone, ShoppingBag, CreditCard, Truck } from "lucide-react";
import { set } from "zod/v4";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global{
    interface Window{
        Razorpay: any;
    }
}

interface UserData {
  us: User | null;
  phone: string;
}

export default function CheckoutContent({ user }: { user: UserData }) {
  const [isEditing, setIsEditing] = useState(!user.us);
  const [currentUser, setCurrentUser] = useState<UserData>(user);
  const [isclient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update currentUser when user prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  if (isclient === false) {
    return (<></>);
  }

  const handleFormSuccess = (updatedUser: User) => {
    setCurrentUser({ ...currentUser, us: updatedUser });
    setIsEditing(false);
  };

  return (
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
                    <CardTitle className="text-xl">Delivery Information</CardTitle>
                  </div>
                  {currentUser.us && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <CheckoutForm user={currentUser} onSuccess={handleFormSuccess} />
                ) : (
                  <UserDetails user={currentUser} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary user={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ user, onSuccess }: { 
  user: UserData; 
  onSuccess: (updatedUser: User) => void; 
}) {
  const [state, action, isPending] = useActionState(
    user.us ? updateUser : createUser,
    { success: false, message: "", user: null }
  );

  // Handle successful form submission
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
            Full Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            defaultValue={user.us?.name || ""}
            className="mt-1"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Delivery Address
          </Label>
          <Input
            type="text"
            id="address"
            name="address"
            defaultValue={user.us?.Address || ""}
            className="mt-1"
            placeholder="Enter your complete address"
            required
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
            Pincode
          </Label>
          <Input 
            type="number" 
            name="pincode" 
            id="pincode"
            defaultValue={user.us?.pincode || ""}
            className="mt-1"
            placeholder="Enter your pincode"
            required
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
            onClick={() => onSuccess(user.us!)}
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
    </form>
  );
}

function UserDetails({ user }: { user: UserData }) {
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
          <p className="text-sm text-gray-600">Delivery Address</p>
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
    </div>
  );
}

function OrderSummary({user}:{user: UserData}) {
  const { cartItems, SetItemQuantity, RemoveProduct, getBasketCount, getTotalPrice} = ProductCart();
  const itemCount = getBasketCount();
  
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
                  onUpdateQuantity={SetItemQuantity}
                  onRemove={RemoveProduct}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <PriceBreakdown user={user} />
              <PurchaseButton user={user} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PriceBreakdown({user}:{user: UserData}) {
  const {getTotalPrice} = ProductCart();
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user.us?.pincode) {
      setDeliveryCharge(null);
      return;
    }

    const fetchDeliveryCharge = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/price', {
          method: "POST",
          body: JSON.stringify({pincode: user.us?.pincode}),
          headers: {"Content-Type": "application/json"}
        });
        const {charge} = await response.json();
        setDeliveryCharge(charge);
      } catch (err) {
        console.log(err);
        setDeliveryCharge(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryCharge();
  }, [user.us?.pincode]);

  const subtotal = getTotalPrice();
  const total = deliveryCharge !== null ? subtotal + deliveryCharge : subtotal;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">{fcurrency(subtotal)}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-1">
          <Truck className="h-4 w-4" />
          Delivery Charge:
        </span>
        <span className="font-medium">
          {loading ? "Calculating..." : 
           deliveryCharge !== null ? fcurrency(deliveryCharge) : 
           user.us?.pincode ? "Error" : "Enter pincode"}
        </span>
      </div>
      
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className="text-blue-600">{fcurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ item, onUpdateQuantity, onRemove }: { 
  item: { item: Product; qty: number }; 
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.item.id);
    } else {
      onUpdateQuantity(item.item.id, newQuantity);
    }
  };

  return (
    <div className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
        {item.item.irul? (
          <img 
            src={item.item.irul} 
            alt={item.item.pname}
            className="w-full h-full object-cover"
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
            onClick={() => onRemove(item.item.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-white rounded-full border border-gray-200 p-1">
            <button
              onClick={() => handleQuantityChange(item.qty - 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              disabled={item.qty <= 1}
            >
              <Minus className="h-3 w-3 text-gray-600" />
            </button>
            
            <span className="text-sm font-medium px-3 min-w-[30px] text-center">
              {item.qty}
            </span>
            
            <button
              onClick={() => handleQuantityChange(item.qty + 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-3 w-3 text-gray-600" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {fcurrency(item.item.price)} × {item.qty}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {fcurrency(item.item.price * item.qty)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseButton({ user}: { user: UserData }) {
  const [isPending, setPending] = useState(false);
  const {cartItems, getTotalPrice, RemoveProduct,ClearBasket} = ProductCart();
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const router = useRouter();

  // Get delivery charge when pincode changes
  useEffect(() => {
    if (!user.us?.pincode) return;
    
    const fetchDeliveryCharge = async () => {
      try {
        const response = await fetch('/api/price', {
          method: "POST",
          body: JSON.stringify({pincode: user.us?.pincode}),
          headers: {"Content-Type": "application/json"}
        });
        const {charge} = await response.json();
        setDeliveryCharge(charge);
      } catch (err) {
        console.log(err);
        setDeliveryCharge(0);
      }
    };

    fetchDeliveryCharge();
  }, [user.us?.pincode]);

  const handlePayment = async () => {
    if (!user.us?.pincode) {
      alert("Please add your delivery address with pincode first");
      return;
    }

    setPending(true);

    try {
      // Create order with correct data
      const res = await fetch("/api/razorpay/order", {
        method: "POST", 
        body: JSON.stringify({
          phoneno: user.phone, 
          cartitems: cartItems,
          pincode: user.us.pincode
        }),  
        headers: {"Content-Type": "application/json"}
      });

      const data = await res.json();
      
      if (!data.orderId) {
        throw new Error("Failed to create order");
      }

      const totalAmount = getTotalPrice() + deliveryCharge;

      const options = {
        key: 'rzp_test_LRGtLburKVlajK',
        amount: totalAmount * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "Roshan Fancy Store",
        description: "Order Payment",
        handler: async function(response: any) {
          try {
            const verify = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(response),
            });
            
            const verifyData = await verify.json();
            console.log(verifyData)
            if (verifyData.success) {
              // Process delivery after successful payment
              const deliveryRes = await fetch('/api/delivery/', {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                  userId: user?.us?.id,
                  cartItems,
                  pricepaid: totalAmount,
                  paymentid: response.razorpay_payment_id,
                  order_id : data.orderId,
                })
              });
              
              if (deliveryRes.ok) {
                alert("Order placed successfully!");
                ClearBasket();
                router.push('/orders/');
              } else {
                alert("Payment successful but order processing failed. Please contact support.");
              }
            } else {
              alert("Payment verification failed");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            alert("Payment verification failed. Please contact support if money was deducted.");
          }
        },
        order_id: data.orderId,
        prefill: {
          name: user?.us?.name || "", 
          contact: user.phone,
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const totalAmount = getTotalPrice() + deliveryCharge;
  const canProceed = user.us?.pincode && cartItems.length > 0;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js"/>
      <div className="flex flex-col items-center justify-center">
        <Button 
          onClick={handlePayment} 
          disabled={isPending || !canProceed}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
        >
          {isPending ? "Processing Payment..." : 
           !user.us?.pincode ? "Add Delivery Address" :
           `Pay ${fcurrency(totalAmount)}`}
        </Button>
        
        {!user.us?.pincode && (
          <p className="text-sm text-gray-500 mt-2">
            Please add your delivery address to proceed
          </p>
        )}
      </div>
    </>
  );
}