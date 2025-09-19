import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";
import API from "../api";
import { 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  QrCodeIcon,
  CalendarIcon,
  TagIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PhotoIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon
} from "@heroicons/react/24/outline";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_cents: number;
  status: string;
  order_type: string;
  created_at: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  restaurant_id?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface UserFormData {
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRCode, setShowQRCode] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    logo_url: ''
  });
  const [staff, setStaff] = useState<User[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const { register: registerStaff, handleSubmit: handleSubmitStaff, reset: resetStaff, setValue: setValueStaff, formState: { errors: errorsStaff } } = useForm<UserFormData>();

  useEffect(() => {
    fetchDashboardData();
    if (user?.role === 'restaurant_admin') {
      fetchStaff();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [restaurantRes, ordersRes, tablesRes] = await Promise.all([
        API.get('/restaurants/me'),
        API.get(`/${user?.restaurant_id}/orders?limit=10`),
        API.get(`/restaurants/${user?.restaurant_id}/tables`)
      ]);

      setRestaurant(restaurantRes.data);
      setRecentOrders(ordersRes.data);
      setTables(tablesRes.data);
      
      // Populate profile data
      setProfileData({
        name: restaurantRes.data.name || '',
        address: restaurantRes.data.address || '',
        phone: restaurantRes.data.phone || '',
        email: restaurantRes.data.email || '',
        description: restaurantRes.data.description || '',
        logo_url: restaurantRes.data.logo_url || ''
      });

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersRes.data.filter((order: Order) => 
        order.created_at.startsWith(today)
      );
      
      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum: number, order: Order) => sum + order.total_cents, 0),
        pendingOrders: ordersRes.data.filter((order: Order) => 
          ['new', 'confirmed', 'preparing'].includes(order.status)
        ).length,
        completedOrders: ordersRes.data.filter((order: Order) => 
          order.status === 'delivered'
        ).length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await API.patch(`/${user?.restaurant_id}/orders/${orderId}`, { status });
      toast.success('Order status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await API.patch(`/restaurants/${user?.restaurant_id}/profile`, profileData);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogoUpload = async (url: string) => {
    try {
      await API.patch(`/restaurants/${user?.restaurant_id}/logo`, { logo_url: url });
      toast.success('Logo updated successfully');
      setProfileData(prev => ({ ...prev, logo_url: url }));
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update logo');
    }
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Staff Management Functions
  const fetchStaff = async () => {
    try {
      const res = await API.get("/auth/users");
      // Filter to only show staff for this restaurant
      const restaurantStaff = res.data.filter((u: User) => 
        u.restaurant_id === user?.restaurant_id && u.role === 'restaurant_staff'
      );
      setStaff(restaurantStaff);
    } catch (error) {
      toast.error('Failed to fetch staff');
    }
  };

  const onSubmitStaff = async (data: UserFormData) => {
    try {
      const staffData = {
        ...data,
        role: 'restaurant_staff',
        restaurant_id: user?.restaurant_id
      };

      if (editingStaff) {
        await API.patch(`/auth/users/${editingStaff.id}`, staffData);
        toast.success('Staff member updated successfully');
        setEditingStaff(null);
      } else {
        await API.post("/auth/users", staffData);
        toast.success('Staff member added successfully');
        setIsAddingStaff(false);
      }
      resetStaff();
      fetchStaff();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const startEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setValueStaff('email', staff.email);
    setValueStaff('first_name', staff.first_name || '');
    setValueStaff('last_name', staff.last_name || '');
  };

  const deleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      await API.delete(`/auth/users/${staffId}`);
      toast.success('Staff member removed successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to remove staff member');
    }
  };

  const cancelStaffEdit = () => {
    setEditingStaff(null);
    setIsAddingStaff(false);
    resetStaff();
  };

  const generateEODReport = async () => {
    try {
      const response = await API.post(`/${user?.restaurant_id}/reports/eod`);
      toast.success('End of Day report generated');
      console.log('EOD Report:', response.data);
    } catch (error) {
      toast.error('Failed to generate EOD report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
              <p className="text-gray-600">{restaurant?.name}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Show QR Codes
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.todayRevenue / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Table QR Codes</h2>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tables.map((table) => (
                  <div key={table.id} className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Table {table.table_number}</h3>
                    <QRCodeGenerator 
                      value={`${window.location.origin}/restaurant/${restaurant?.id}/table/${table.id}/menu`}
                      size={200}
                    />
                    <p className="text-sm text-gray-500 mt-2">Capacity: {table.capacity} people</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                Recent Orders
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab('management')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'management'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Management
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              {user?.role === 'restaurant_admin' && (
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'staff'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Staff Management
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customer_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {order.order_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(order.total_cents / 100).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {order.status === 'new' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Confirm
                                </button>
                              )}
                              {order.status === 'confirmed' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  Start Preparing
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {order.status === 'ready' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                  <button
                    onClick={generateEODReport}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                    Generate EOD Report
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Order Types</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'management' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Link
                    to={`/restaurant/${user?.restaurant_id}/admin/menu`}
                    className="block p-6 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    <CogIcon className="h-8 w-8 text-blue-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Menu Management</h4>
                    <p className="text-gray-600">Add, edit, or remove menu items and categories</p>
                  </Link>
                  
                  <div className="block p-6 bg-green-50 rounded-lg border-2 border-green-200">
                    <TagIcon className="h-8 w-8 text-green-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Promotions</h4>
                    <p className="text-gray-600">Create and manage promotional offers</p>
                  </div>
                  
                  <div className="block p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <CalendarIcon className="h-8 w-8 text-purple-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Reservations</h4>
                    <p className="text-gray-600">View and manage table reservations</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Restaurant Profile</h3>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    {editingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Information */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restaurant Name
                          </label>
                          {editingProfile ? (
                            <input
                              type="text"
                              value={profileData.name}
                              onChange={(e) => handleProfileInputChange('name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{restaurant?.name || 'Not set'}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          {editingProfile ? (
                            <textarea
                              value={profileData.address}
                              onChange={(e) => handleProfileInputChange('address', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{restaurant?.address || 'Not set'}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          {editingProfile ? (
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{restaurant?.phone || 'Not set'}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          {editingProfile ? (
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => handleProfileInputChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{restaurant?.email || 'Not set'}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          {editingProfile ? (
                            <textarea
                              value={profileData.description}
                              onChange={(e) => handleProfileInputChange('description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{restaurant?.description || 'Not set'}</p>
                          )}
                        </div>
                      </div>
                      
                      {editingProfile && (
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            onClick={() => setEditingProfile(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleProfileUpdate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo Management */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Restaurant Logo</h4>
                      
                      <div className="text-center">
                        {restaurant?.logo_url ? (
                          <div className="mb-4">
                            <img
                              src={restaurant.logo_url}
                              alt="Restaurant Logo"
                              className="h-32 w-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
                            />
                          </div>
                        ) : (
                          <div className="mb-4">
                            <div className="h-32 w-32 bg-gray-100 rounded-lg mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <PhotoIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          </div>
                        )}
                        
                        <ImageUpload
                          onImageUploaded={handleLogoUpload}
                          currentImage={restaurant?.logo_url}
                          label="Upload new logo"
                          className="max-w-sm mx-auto"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Quick Stats</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-sm font-medium ${
                            restaurant?.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {restaurant?.status || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Monthly Capacity:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {restaurant?.monthly_capacity || 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tables:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {tables.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'staff' && user?.role === 'restaurant_admin' && (
              <div>
                {/* Add/Edit Staff Form */}
                {(isAddingStaff || editingStaff) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h3>
                    
                    <form onSubmit={handleSubmitStaff(onSubmitStaff)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            {...registerStaff('email', { required: 'Email is required' })}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="staff@example.com"
                          />
                          {errorsStaff.email && (
                            <p className="text-red-600 text-sm mt-1">{errorsStaff.email.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            {...registerStaff('first_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            {...registerStaff('last_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Doe"
                          />
                        </div>
                        
                        {!editingStaff && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Password *
                            </label>
                            <input
                              {...registerStaff('password', { required: !editingStaff ? 'Password is required' : false })}
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Password"
                            />
                            {errorsStaff.password && (
                              <p className="text-red-600 text-sm mt-1">{errorsStaff.password.message}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={cancelStaffEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {editingStaff ? 'Update Staff' : 'Add Staff'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Staff List */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Staff Members</h3>
                  {!isAddingStaff && !editingStaff && (
                    <button
                      onClick={() => setIsAddingStaff(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <UsersIcon className="h-5 w-5 mr-2" />
                      Add Staff Member
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staff.map((staffMember) => (
                        <tr key={staffMember.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {staffMember.first_name && staffMember.last_name 
                                ? `${staffMember.first_name} ${staffMember.last_name}` 
                                : staffMember.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {staffMember.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Staff
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(staffMember.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditStaff(staffMember)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteStaff(staffMember.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove"
                              >
                                <UsersIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {staff.length === 0 && (
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No staff members added yet</p>
                      <button
                        onClick={() => setIsAddingStaff(true)}
                        className="mt-2 text-blue-600 hover:text-blue-500"
                      >
                        Add your first staff member
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
