import API from "../api";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  cuisine_type: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  status: string;
  monthly_capacity: number;
  gst_settings: any;
}

interface RestaurantFormData {
  name: string;
  logo_url: string;
  cuisine_type: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  monthly_capacity: number;
}

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RestaurantFormData>();

  useEffect(() => {
    fetchRestaurants();
    fetchStats();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await API.get("/restaurants");
      setRestaurants(res.data);
    } catch (error) {
      toast.error('Failed to fetch restaurants');
    }
  };

  const fetchStats = async () => {
    // This would be implemented with actual API calls
    setStats({
      totalRestaurants: restaurants.length,
      activeRestaurants: restaurants.filter(r => r.status === 'active').length,
      totalOrders: 0,
      totalRevenue: 0
    });
  };

  const onSubmitRestaurant = async (data: RestaurantFormData) => {
    try {
      if (editingRestaurant) {
        await API.patch(`/restaurants/${editingRestaurant.id}`, data);
        toast.success('Restaurant updated successfully');
        setEditingRestaurant(null);
      } else {
        const response = await API.post("/restaurants", data);
        toast.success('Restaurant added successfully');
        setCreatedRestaurant(response.data);
        setIsAddingRestaurant(false);
      }
      reset();
      fetchRestaurants();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const toggleRestaurantStatus = async (restaurant: Restaurant) => {
    try {
      const newStatus = restaurant.status === 'active' ? 'inactive' : 'active';
      await API.patch(`/restaurants/${restaurant.id}/status`, { status: newStatus });
      toast.success(`Restaurant ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to update restaurant status');
    }
  };

  const startEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setValue('name', restaurant.name);
    setValue('logo_url', restaurant.logo_url || '');
    setValue('cuisine_type', restaurant.cuisine_type || '');
    setValue('address', restaurant.address || '');
    setValue('phone', restaurant.phone || '');
    setValue('email', restaurant.email || '');
    setValue('description', restaurant.description || '');
    setValue('monthly_capacity', restaurant.monthly_capacity || 1000);
  };

  const cancelEdit = () => {
    setEditingRestaurant(null);
    setIsAddingRestaurant(false);
    reset();
  };

  const handleLogoUpload = async (restaurantId: string, url: string) => {
    try {
      await API.patch(`/restaurants/${restaurantId}/logo`, { logo_url: url });
      toast.success('Logo updated successfully');
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to update logo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Manage restaurants and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
                <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {restaurants.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Restaurant Management
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                System Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Success Modal for Created Restaurant */}
            {createdRestaurant && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Restaurant Created Successfully! 🎉
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Restaurant Details:</h4>
                      <p><strong>Name:</strong> {createdRestaurant.name}</p>
                      <p><strong>Subdomain:</strong> {createdRestaurant.subdomain}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Login Credentials:</h4>
                      <p><strong>Email:</strong> {createdRestaurant.admin_credentials?.email}</p>
                      <p><strong>Password:</strong> {createdRestaurant.admin_credentials?.password}</p>
                      <p className="text-sm text-blue-600 mt-2">
                        Admin can login at: <strong>{createdRestaurant.subdomain}/login</strong>
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Public Menu:</h4>
                      <p className="text-sm text-green-600">
                        Customers can view the menu at: <strong>{createdRestaurant.subdomain}</strong>
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> Please save these credentials and share them with the restaurant admin. 
                        The password cannot be recovered from this interface.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setCreatedRestaurant(null)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div>
                {/* Add/Edit Restaurant Form */}
                {(isAddingRestaurant || editingRestaurant) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                    </h3>
                    
                    <form onSubmit={handleSubmit(onSubmitRestaurant)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restaurant Name *
                          </label>
                          <input
                            {...register('name', { required: 'Restaurant name is required' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter restaurant name"
                          />
                          {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuisine Type
                          </label>
                          <input
                            {...register('cuisine_type')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Italian, Chinese, Indian"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restaurant Logo
                          </label>
                          <ImageUpload
                            onImageUploaded={(url) => setValue('logo_url', url)}
                            currentImage={editingRestaurant?.logo_url}
                            label="Upload restaurant logo"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Capacity
                          </label>
                          <input
                            {...register('monthly_capacity', { valueAsNumber: true })}
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="1000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            {...register('phone')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            {...register('email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="restaurant@example.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          {...register('address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123 Main St, City, State 12345"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description of the restaurant"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {editingRestaurant ? 'Update Restaurant' : 'Add Restaurant'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Restaurant List */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Restaurants</h3>
                  {!isAddingRestaurant && !editingRestaurant && (
                    <button
                      onClick={() => setIsAddingRestaurant(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Restaurant
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Restaurant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuisine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {restaurants.map((restaurant) => (
                        <tr key={restaurant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={restaurant.logo_url || 'https://dummyimage.com/40x40/e5e7eb/9ca3af&text=R'}
                                alt={restaurant.name}
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://dummyimage.com/40x40/f3f4f6/9ca3af&text=${encodeURIComponent(restaurant.name.charAt(0))}`;
                                }}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {restaurant.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {restaurant.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {restaurant.cuisine_type || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              restaurant.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {restaurant.monthly_capacity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditRestaurant(restaurant)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleRestaurantStatus(restaurant)}
                                className={`${
                                  restaurant.status === 'active'
                                    ? 'text-red-600 hover:text-red-900'
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={restaurant.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Platform Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue="Octopoz Multi-Restaurant"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Support Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue="support@octopoz.com"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Access Control Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h5>
                          <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                        </div>
                        <button className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">Session Timeout</h5>
                          <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                        </div>
                        <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>2 hours</option>
                          <option>4 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">System Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">99.9%</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">24/7</div>
                        <div className="text-sm text-gray-600">Support</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">v2.1.0</div>
                        <div className="text-sm text-gray-600">Version</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
