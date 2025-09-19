import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    if (subdomain) {
      fetchMenuData();
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
              {filteredItems.map((item) => (
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
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      {item.prep_time_minutes > 0 && (
                        <span>⏱️ {item.prep_time_minutes} min</span>
                      )}
                      
                      {item.allergens.length > 0 && (
                        <span className="text-orange-600">
                          ⚠️ Contains: {item.allergens.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
