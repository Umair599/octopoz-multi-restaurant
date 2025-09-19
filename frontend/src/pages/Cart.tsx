import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  MinusIcon, 
  PlusIcon, 
  TrashIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import PaymentForm from '../components/PaymentForm';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  images: string[];
  allergens: string[];
  dietary_info: string[];
  prep_time_minutes: number;
  category_id: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
}

interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'pickup' | 'delivery' | 'dine_in';
  delivery_address?: string;
  special_instructions?: string;
}

// Function to get subdomain from hostname
function getSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost development, subdomain comes before .localhost
  if (hostname.includes('.localhost')) {
    return parts[0] !== 'localhost' ? parts[0] : null;
  }
  
  // For production, subdomain comes before main domain
  if (parts.length > 2) {
    return parts[0];
  }
  
  return null;
}

export default function Cart() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    order_type: 'pickup',
    delivery_address: '',
    special_instructions: ''
  });

  // Check if we're on a subdomain
  const subdomain = getSubdomain();
  const actualRestaurantId = restaurantId || subdomain;

  useEffect(() => {
    // Load cart from localStorage
    const cartKey = subdomain ? `cart_${subdomain}` : `cart_${restaurantId}`;
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    if (actualRestaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId, subdomain, actualRestaurantId]);

  const fetchRestaurant = async () => {
    try {
      let response;
      if (subdomain) {
        response = await fetch(`http://localhost:4000/api/restaurants/by-subdomain/${subdomain}`);
      } else {
        response = await fetch(`http://localhost:4000/api/restaurants/${actualRestaurantId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant information');
    } finally {
      setLoading(false);
    }
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    let updatedCart;
    
    if (newQuantity === 0) {
      updatedCart = cart.filter(item => item.id !== itemId);
    } else {
      updatedCart = cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    }
    
    setCart(updatedCart);
    const cartKey = subdomain ? `cart_${subdomain}` : `cart_${restaurantId}`;
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    
    if (newQuantity === 0) {
      toast.success('Item removed from cart');
    }
  };

  const removeFromCart = (itemId: string) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    const cartKey = subdomain ? `cart_${subdomain}` : `cart_${restaurantId}`;
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTax = () => {
    const subtotal = getTotalPrice();
    return Math.round(subtotal * 0.08); // 8% tax
  };

  const getFinalTotal = () => {
    return getTotalPrice() + calculateTax();
  };

  const handleProceedToPayment = () => {
    // Validate order data
    if (!orderData.customer_name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!orderData.customer_email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!orderData.customer_phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (orderData.order_type === 'delivery' && !orderData.delivery_address?.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      const orderPayload = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price_cents: item.price_cents,
          quantity: item.quantity
        })),
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        order_type: orderData.order_type,
        subtotal_cents: getTotalPrice(),
        tax_cents: calculateTax(),
        discount_cents: 0,
        total_cents: getFinalTotal(),
        payment_method: 'stripe',
        payment_id: paymentId,
        special_instructions: orderData.special_instructions,
        delivery_address: orderData.order_type === 'delivery' ? orderData.delivery_address : null,
        table_id: null,
        promotion_id: null
      };

      const response = await fetch(`http://localhost:4000/api/${actualRestaurantId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const orderData = await response.json();
        
        // Clear cart
        setCart([]);
        const cartKey = subdomain ? `cart_${subdomain}` : `cart_${restaurantId}`;
        localStorage.removeItem(cartKey);
        
        toast.success('Order placed successfully!');
        
        // Redirect to order confirmation
        const confirmationPath = subdomain 
          ? `/order-confirmation/${orderData.order_number}`
          : `/restaurant/${restaurantId}/order-confirmation/${orderData.order_number}`;
        navigate(confirmationPath);
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <Link
              to={`/restaurant/${restaurantId}/menu`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Menu
            </Link>
          </div>

          <div className="text-center py-12">
            <ShoppingCartIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some delicious items from the menu to get started!</p>
            <Link
              to={subdomain ? "/" : `/restaurant/${restaurantId}/menu`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowPayment(false)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Cart
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-2" />
              Payment
            </h2>
            
            <PaymentForm
              amount={getFinalTotal()}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to={subdomain ? "/" : `/restaurant/${restaurantId}/menu`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Menu
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCartIcon className="h-6 w-6 mr-2" />
            Cart ({getTotalItems()} items)
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      {item.images && item.images.length > 0 && (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">${(item.price_cents / 100).toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${(getTotalPrice() / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span>${(calculateTax() / 100).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${(getFinalTotal() / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information Form */}
              <div className="space-y-4 mb-6">
                <h3 className="font-medium text-gray-900">Customer Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={orderData.customer_name}
                    onChange={(e) => setOrderData({ ...orderData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={orderData.customer_email}
                    onChange={(e) => setOrderData({ ...orderData, customer_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={orderData.customer_phone}
                    onChange={(e) => setOrderData({ ...orderData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type *
                  </label>
                  <select
                    value={orderData.order_type}
                    onChange={(e) => setOrderData({ ...orderData, order_type: e.target.value as 'pickup' | 'delivery' | 'dine_in' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                    <option value="dine_in">Dine In</option>
                  </select>
                </div>

                {orderData.order_type === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      value={orderData.delivery_address || ''}
                      onChange={(e) => setOrderData({ ...orderData, delivery_address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your delivery address"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={orderData.special_instructions || ''}
                    onChange={(e) => setOrderData({ ...orderData, special_instructions: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special requests or instructions"
                  />
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
