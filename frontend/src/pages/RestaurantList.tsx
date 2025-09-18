import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MagnifyingGlassIcon, MapPinIcon, ClockIcon, StarIcon } from "@heroicons/react/24/outline";

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  cuisine_type: string;
  address: string;
  description: string;
  operating_hours: any;
}

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/admin" />;

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchTerm, selectedCuisine]);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/restaurants/public");
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = restaurants;

    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCuisine) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine_type?.toLowerCase().includes(selectedCuisine.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  };

  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Restaurants
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Order from your favorite local restaurants with fast delivery and pickup options
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search restaurants, cuisines, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[150px]"
                >
                  <option value="">All Cuisines</option>
                  {cuisineTypes.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredRestaurants.length} Restaurant{filteredRestaurants.length !== 1 ? 's' : ''} Available
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="relative h-48">
                    <img
                      src={restaurant.logo_url || 'https://dummyimage.com/400x200/e5e7eb/9ca3af&text=Restaurant'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://dummyimage.com/400x200/f3f4f6/9ca3af&text=${encodeURIComponent(restaurant.name)}`;
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-white rounded-full px-2 py-1 flex items-center space-x-1 text-sm">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">4.5</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {restaurant.name}
                      </h3>
                    </div>

                    {restaurant.cuisine_type && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                        {restaurant.cuisine_type}
                      </span>
                    )}

                    {restaurant.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}

                    {restaurant.address && (
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>30-45 min delivery</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/restaurant/${restaurant.id}/menu`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        View Menu
                      </Link>
                      <Link
                        to={`/restaurant/${restaurant.id}/reserve`}
                        className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Reserve Table
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
