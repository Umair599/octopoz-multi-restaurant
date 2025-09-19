import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  description: string;
  address: string;
  phone: string;
  cuisine_type: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  images: string[];
  allergens: string[];
  dietary_info: string[];
  prep_time_minutes: number;
}

interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
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

export default function PublicMenu() {
  const subdomain = getSubdomain();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (subdomain) {
      fetchMenuData();
      // Load cart from localStorage
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, [subdomain]);

  const fetchMenuData = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/by-subdomain/${subdomain}/menu`);
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      } else {
        console.error('Restaurant not found');
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
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
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(updatedCart));
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
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(updatedCart));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  const { restaurant, categories, items } = menuData;
  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="h-16 w-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                {restaurant.cuisine_type && (
                  <p className="text-lg text-gray-600">{restaurant.cuisine_type} Cuisine</p>
                )}
                {restaurant.description && (
                  <p className="text-gray-600 mt-2">{restaurant.description}</p>
                )}
              </div>
            </div>
            
            {/* Admin Login Link */}
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          </div>
          
          {/* Restaurant Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {restaurant.address && (
              <div>📍 {restaurant.address}</div>
            )}
            {restaurant.phone && (
              <div>📞 {restaurant.phone}</div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    selectedCategory === ''
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Items
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.name 
                  : 'All Menu Items'}
              </h2>
              {selectedCategory && (
                <p className="text-gray-600 mt-1">
                  {categories.find(c => c.id === selectedCategory)?.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item) => {
                const cartItem = cart.find(cartItem => cartItem.id === item.id);
                const quantity = cartItem ? cartItem.quantity : 0;
                
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    {item.images && item.images.length > 0 && (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <span className="text-lg font-bold text-green-600">
                          ${(item.price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-gray-600 mb-3">{item.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.dietary_info.map((info, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                          >
                            {info}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        {item.prep_time_minutes > 0 && (
                          <span>⏱️ {item.prep_time_minutes} min</span>
                        )}
                        
                        {item.allergens.length > 0 && (
                          <span className="text-orange-600">
                            ⚠️ Contains: {item.allergens.join(', ')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {quantity > 0 ? (
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
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600">
                  {selectedCategory 
                    ? 'This category doesn\'t have any items yet.'
                    : 'This restaurant hasn\'t added any menu items yet.'}
                </p>
              </div>
            )}
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
              to="/cart"
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
