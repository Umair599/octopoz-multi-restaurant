import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import { 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  QrCodeIcon,
  CalendarIcon,
  TagIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchDashboardData();
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
          </div>
        </div>
      </div>
    </div>
  );
}
