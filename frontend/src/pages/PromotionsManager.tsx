import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  TagIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  discount_value: number;
  applicable_items: string[];
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  active: boolean;
  conditions: any;
}

interface MenuItem {
  id: string;
  name: string;
  price_cents: number;
}

interface PromotionFormData {
  name: string;
  description: string;
  type: string;
  discount_value: number;
  applicable_items: string[];
  start_date: string;
  end_date: string;
  usage_limit: number;
  minimum_order_amount: number;
}

export default function PromotionsManager() {
  const { id } = useParams();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PromotionFormData>();

  const watchType = watch('type');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [promotionsRes, menuItemsRes] = await Promise.all([
        API.get(`/${id}/promotions`),
        API.get(`/${id}/menu-items`)
      ]);
      
      setPromotions(promotionsRes.data);
      setMenuItems(menuItemsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PromotionFormData) => {
    try {
      const formattedData = {
        ...data,
        discount_value: Number(data.discount_value),
        usage_limit: Number(data.usage_limit),
        conditions: {
          minimum_order_amount: data.minimum_order_amount ? Number(data.minimum_order_amount) : null
        }
      };

      if (editingPromotion) {
        await API.patch(`/${id}/promotions/${editingPromotion.id}`, formattedData);
        toast.success('Promotion updated successfully');
        setEditingPromotion(null);
      } else {
        await API.post(`/${id}/promotions`, formattedData);
        toast.success('Promotion created successfully');
        setIsAddingPromotion(false);
      }
      
      reset();
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const togglePromotionStatus = async (promotion: Promotion) => {
    try {
      await API.patch(`/${id}/promotions/${promotion.id}`, {
        active: !promotion.active
      });
      toast.success(`Promotion ${!promotion.active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update promotion status');
    }
  };

  const deletePromotion = async (promotionId: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      try {
        await API.delete(`/${id}/promotions/${promotionId}`);
        toast.success('Promotion deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete promotion');
      }
    }
  };

  const startEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setValue('name', promotion.name);
    setValue('description', promotion.description || '');
    setValue('type', promotion.type);
    setValue('discount_value', promotion.discount_value);
    setValue('applicable_items', promotion.applicable_items || []);
    setValue('start_date', promotion.start_date ? format(new Date(promotion.start_date), 'yyyy-MM-dd') : '');
    setValue('end_date', promotion.end_date ? format(new Date(promotion.end_date), 'yyyy-MM-dd') : '');
    setValue('usage_limit', promotion.usage_limit || 0);
    setValue('minimum_order_amount', promotion.conditions?.minimum_order_amount || 0);
  };

  const cancelEdit = () => {
    setEditingPromotion(null);
    setIsAddingPromotion(false);
    reset();
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentage Discount';
      case 'fixed_amount': return 'Fixed Amount Off';
      case 'combo_deal': return 'Combo Deal';
      default: return type;
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (!promotion.active) return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (now < startDate) return { status: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (now > endDate) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return { status: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    }
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
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
            <div className="flex items-center space-x-4">
              <Link to="/restaurant-dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Promotions Manager</h1>
                <p className="text-gray-600">Create and manage promotional offers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Promotion Form */}
        {(isAddingPromotion || editingPromotion) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotion Name *
                  </label>
                  <input
                    {...register('name', { required: 'Promotion name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Happy Hour Special"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotion Type *
                  </label>
                  <select
                    {...register('type', { required: 'Promotion type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed_amount">Fixed Amount Off</option>
                    <option value="combo_deal">Combo Deal</option>
                  </select>
                  {errors.type && (
                    <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      {...register('discount_value', { required: 'Discount value is required', valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={watchType === 'percentage' ? '10' : '500'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">
                        {watchType === 'percentage' ? '%' : watchType === 'fixed_amount' ? '¢' : ''}
                      </span>
                    </div>
                  </div>
                  {errors.discount_value && (
                    <p className="text-red-600 text-sm mt-1">{errors.discount_value.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit
                  </label>
                  <input
                    {...register('usage_limit', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    {...register('start_date', { required: 'Start date is required' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    {...register('end_date', { required: 'End date is required' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.end_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the promotion details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Menu Items
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {menuItems.map((item) => (
                    <label key={item.id} className="flex items-center space-x-2">
                      <input
                        {...register('applicable_items')}
                        type="checkbox"
                        value={item.id}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (cents)
                </label>
                <input
                  {...register('minimum_order_amount', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2000 for $20.00 minimum"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Promotions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Promotions ({promotions.length})
              </h3>
              {!isAddingPromotion && !editingPromotion && (
                <button
                  onClick={() => setIsAddingPromotion(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Promotion
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {promotions.map((promotion) => {
              const status = getPromotionStatus(promotion);
              
              return (
                <div key={promotion.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <TagIcon className="h-5 w-5 text-gray-400" />
                        <h4 className="text-lg font-medium text-gray-900">{promotion.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">{promotion.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{getPromotionTypeLabel(promotion.type)}</span>
                          <span>
                            {promotion.type === 'percentage' ? `${promotion.discount_value}% off` : 
                             promotion.type === 'fixed_amount' ? `$${(promotion.discount_value / 100).toFixed(2)} off` : 
                             'Special deal'}
                          </span>
                          {promotion.usage_limit && (
                            <span>{promotion.used_count}/{promotion.usage_limit} used</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(promotion.start_date), 'MMM d, yyyy')} - {format(new Date(promotion.end_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditPromotion(promotion)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => togglePromotionStatus(promotion)}
                        className={`${promotion.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={promotion.active ? 'Deactivate' : 'Activate'}
                      >
                        {promotion.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deletePromotion(promotion.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {promotions.length === 0 && (
              <div className="p-12 text-center">
                <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
                <p className="text-gray-500 mb-4">Create your first promotion to attract customers</p>
                <button
                  onClick={() => setIsAddingPromotion(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Promotion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
