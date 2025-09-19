import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCartIcon, PlusIcon, MinusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  images: string[];
  category_id: string;
  allergens: string[];
  dietary_info: string[];
  prep_time_minutes: number;
  available: boolean;
  sold_out: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  cuisine_type: string;
  address: string;
  description: string;
  phone: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CustomerMenu() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchMenu();
      // Load cart from localStorage
      const savedCart = localStorage.getItem(`cart_${restaurantId}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/${restaurantId}/menu`);
      const data = await response.json();
      
      setRestaurant(data.restaurant);
      setCategories(data.categories);
      setMenuItems(data.items);
      
      if (data.categories.length > 0) {
        setActiveCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let updatedCart;
    
    if (existingItem) {
      updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }
    
    setCart(updatedCart);
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(updatedCart));
    toast.success(`${item.name} added to cart`);
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
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(updatedCart));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredItems = menuItems.filter(item => 
    !activeCategory || item.category_id === activeCategory
  );

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <img
                  src={restaurant.logo_url || 'https://dummyimage.com/40x40/e5e7eb/9ca3af&text=R'}
                  alt={restaurant.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{restaurant.name}</h1>
                  <p className="text-sm text-gray-500">{restaurant.cuisine_type}</p>
                </div>
              </div>
            </div>
            
            <Link
              to={`/restaurant/${restaurantId}/cart`}
              className="relative inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              {restaurant.description && (
                <p className="text-gray-600 mb-4">{restaurant.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {restaurant.address && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {restaurant.address}
                  </div>
                )}
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  30-45 min delivery
                </div>
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                  4.5 (120 reviews)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1">
            <div className="grid gap-6">
              {filteredItems.map((item) => {
                const cartItem = cart.find(cartItem => cartItem.id === item.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {item.images && item.images.length > 0 && (
                        <div className="md:w-48 flex-shrink-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-32 md:h-24 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <span className="text-lg font-bold text-gray-900">
                            ${(item.price_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          {item.prep_time_minutes && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {item.prep_time_minutes} min
                            </span>
                          )}
                          
                          {item.dietary_info && item.dietary_info.length > 0 && (
                            <div className="flex gap-1">
                              {item.dietary_info.map((info, index) => (
                                <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {info}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {item.sold_out ? (
                            <span className="text-red-600 font-medium">Sold Out</span>
                          ) : !item.available ? (
                            <span className="text-gray-500 font-medium">Not Available</span>
                          ) : quantity > 0 ? (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateCartQuantity(item.id, quantity - 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="font-medium">{quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.id, quantity + 1)}
                                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                              >
                                <PlusIcon className="h-4 w-4 text-blue-600" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Summary */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between min-w-[200px]">
            <div>
              <div className="font-medium">{getTotalItems()} items</div>
              <div className="text-sm">${(getTotalPrice() / 100).toFixed(2)}</div>
            </div>
            <Link
              to={`/restaurant/${restaurantId}/cart`}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
