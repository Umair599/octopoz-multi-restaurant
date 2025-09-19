import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: string;
  items: any[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: string;
  payment_status: string;
  special_instructions?: string;
  delivery_address?: string;
  created_at: string;
}

export default function OrderConfirmation() {
  const { restaurantId, orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId && orderNumber) {
      fetchOrderDetails();
      fetchRestaurant();
    }
  }, [restaurantId, orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/${restaurantId}/orders/${orderNumber}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        console.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
          <Link
            to={`/restaurant/${restaurantId}/menu`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Your order has been successfully placed and is being prepared.
            </p>
          </div>

          {/* Order Details */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Type:</span>
                    <span className="font-medium capitalize">{order.order_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize text-green-600">{order.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium text-green-600 capitalize">{order.payment_status}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{order.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{order.customer_phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {order.delivery_address && (
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
              </div>
            )}

            {order.special_instructions && (
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
                <p className="text-sm text-gray-600">{order.special_instructions}</p>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">
                      ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>${(order.tax_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${(order.total_cents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Contact */}
          <div className="border-t pt-8 mt-8">
            <h3 className="font-medium text-gray-900 mb-4">Restaurant Contact</h3>
            <div className="flex items-center space-x-4">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="h-12 w-12 object-cover rounded-lg"
                />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                <p className="text-sm text-gray-600">{restaurant.phone}</p>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-8">
            <Link
              to={`/restaurant/${restaurantId}/menu`}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Menu
            </Link>
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
