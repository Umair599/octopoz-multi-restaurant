import React, { useState, useEffect } from "react";
import API from "../api";
import ImageUpload from "../components/ImageUpload";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  EyeSlashIcon,
  FolderPlusIcon,
  PhotoIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  images: string[];
  available: boolean;
  sold_out: boolean;
  allergens: string[];
  dietary_info: string[];
  prep_time_minutes: number;
  gst_rate: number;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  available: boolean;
  sort_order: number;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  prep_time_minutes: number;
  gst_rate: number;
  allergens: string;
  dietary_info: string;
}

interface CategoryFormData {
  name: string;
  description: string;
}

export default function MenuManager() {
  const { id } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('items');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [itemImages, setItemImages] = useState<string[]>([]);

  const { register: registerItem, handleSubmit: handleSubmitItem, reset: resetItem, setValue: setValueItem, formState: { errors: errorsItem } } = useForm<MenuItemFormData>();
  const { register: registerCategory, handleSubmit: handleSubmitCategory, reset: resetCategory, setValue: setValueCategory, formState: { errors: errorsCategory } } = useForm<CategoryFormData>();

  useEffect(() => {
    if (id) {
      fetchMenuData();
      fetchRestaurant();
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const response = await API.get(`/restaurants/me`);
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchMenuData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        API.get(`/${id}/menu-items`),
        API.get(`/${id}/categories`)
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast.error('Failed to load menu data');
    }
  };

  const onSubmitItem = async (data: MenuItemFormData) => {
    try {
      const formattedData = {
        ...data,
        price_cents: Number(data.price_cents),
        prep_time_minutes: Number(data.prep_time_minutes),
        gst_rate: Number(data.gst_rate),
        allergens: data.allergens ? data.allergens.split(',').map(s => s.trim()) : [],
        dietary_info: data.dietary_info ? data.dietary_info.split(',').map(s => s.trim()) : [],
        images: itemImages
      };

      if (editingItem) {
        await API.patch(`/${id}/menu-items/${editingItem.id}`, formattedData);
        toast.success('Menu item updated successfully');
        setEditingItem(null);
      } else {
        await API.post(`/${id}/menu-items`, formattedData);
        toast.success('Menu item added successfully');
        setIsAddingItem(false);
      }
      resetItem();
      setItemImages([]);
      fetchMenuData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const onSubmitCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await API.patch(`/${id}/categories/${editingCategory.id}`, data);
        toast.success('Category updated successfully');
        setEditingCategory(null);
      } else {
        await API.post(`/${id}/categories`, data);
        toast.success('Category added successfully');
        setIsAddingCategory(false);
      }
      resetCategory();
      fetchMenuData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await API.patch(`/${id}/menu-items/${item.id}/availability`, {
        available: !item.available,
        sold_out: item.sold_out
      });
      toast.success(`Item ${!item.available ? 'enabled' : 'disabled'}`);
      fetchMenuData();
    } catch (error) {
      toast.error('Failed to update item availability');
    }
  };

  const toggleItemSoldOut = async (item: MenuItem) => {
    try {
      await API.patch(`/${id}/menu-items/${item.id}/availability`, {
        available: item.available,
        sold_out: !item.sold_out
      });
      toast.success(`Item marked as ${!item.sold_out ? 'sold out' : 'available'}`);
      fetchMenuData();
    } catch (error) {
      toast.error('Failed to update item status');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await API.delete(`/${id}/menu-items/${itemId}`);
        toast.success('Item deleted successfully');
        fetchMenuData();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await API.delete(`/${id}/categories/${categoryId}`);
        toast.success('Category deleted successfully');
        fetchMenuData();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setValueItem('name', item.name);
    setValueItem('description', item.description || '');
    setValueItem('price_cents', item.price_cents);
    setValueItem('category_id', item.category_id || '');
    setValueItem('prep_time_minutes', item.prep_time_minutes || 0);
    setValueItem('gst_rate', item.gst_rate || 0);
    setValueItem('allergens', item.allergens?.join(', ') || '');
    setValueItem('dietary_info', item.dietary_info?.join(', ') || '');
    setItemImages(item.images || []);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setValueCategory('name', category.name);
    setValueCategory('description', category.description || '');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingCategory(null);
    setIsAddingItem(false);
    setIsAddingCategory(false);
    resetItem();
    resetCategory();
    setItemImages([]);
  };

  const handleImagesUploaded = (urls: string[]) => {
    setItemImages(prev => [...prev, ...urls]);
  };

  const removeImage = (index: number) => {
    setItemImages(prev => prev.filter((_, i) => i !== index));
  };

  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-600">{restaurant?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Menu Items ({items.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categories.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'items' && (
              <div>
                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Add/Edit Item Form */}
                {(isAddingItem || editingItem) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </h3>
                    
                    <form onSubmit={handleSubmitItem(onSubmitItem)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name *
                          </label>
                          <input
                            {...registerItem('name', { required: 'Item name is required' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter item name"
                          />
                          {errorsItem.name && (
                            <p className="text-red-600 text-sm mt-1">{errorsItem.name.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            {...registerItem('category_id')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (cents) *
                          </label>
                          <input
                            {...registerItem('price_cents', { required: 'Price is required', valueAsNumber: true })}
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 1500 for $15.00"
                          />
                          {errorsItem.price_cents && (
                            <p className="text-red-600 text-sm mt-1">{errorsItem.price_cents.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prep Time (minutes)
                          </label>
                          <input
                            {...registerItem('prep_time_minutes', { valueAsNumber: true })}
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 15"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GST Rate (%)
                          </label>
                          <input
                            {...registerItem('gst_rate', { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 5.5"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...registerItem('description')}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description of the item"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allergens (comma-separated)
                        </label>
                        <input
                          {...registerItem('allergens')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., nuts, dairy, gluten"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dietary Info (comma-separated)
                        </label>
                        <input
                          {...registerItem('dietary_info')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., vegan, vegetarian, gluten-free"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Images
                        </label>
                        <ImageUpload
                          multiple
                          maxImages={3}
                          onImagesUploaded={handleImagesUploaded}
                          label="Upload item images (max 3)"
                        />
                        
                        {itemImages.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {itemImages.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={imageUrl}
                                  alt={`Item image ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
                          {editingItem ? 'Update Item' : 'Add Item'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Items List */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Menu Items {selectedCategory && `(${filteredItems.length})`}
                  </h3>
                  {!isAddingItem && !editingItem && (
                    <button
                      onClick={() => setIsAddingItem(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Item
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm font-medium text-green-600">
                                  ${(item.price_cents / 100).toFixed(2)}
                                </span>
                                {item.prep_time_minutes && (
                                  <span className="text-xs text-gray-500">
                                    {item.prep_time_minutes} min
                                  </span>
                                )}
                                <div className="flex space-x-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.available ? 'Available' : 'Unavailable'}
                                  </span>
                                  {item.sold_out && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                      Sold Out
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditItem(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleItemAvailability(item)}
                            className={`${item.available ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={item.available ? 'Disable' : 'Enable'}
                          >
                            {item.available ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => toggleItemSoldOut(item)}
                            className="text-orange-600 hover:text-orange-900"
                            title={item.sold_out ? 'Mark Available' : 'Mark Sold Out'}
                          >
                            {item.sold_out ? '✓' : '⚠️'}
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                {/* Add/Edit Category Form */}
                {(isAddingCategory || editingCategory) && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    
                    <form onSubmit={handleSubmitCategory(onSubmitCategory)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name *
                        </label>
                        <input
                          {...registerCategory('name', { required: 'Category name is required' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter category name"
                        />
                        {errorsCategory.name && (
                          <p className="text-red-600 text-sm mt-1">{errorsCategory.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...registerCategory('description')}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description of the category"
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
                          {editingCategory ? 'Update Category' : 'Add Category'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Categories List */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Categories</h3>
                  {!isAddingCategory && !editingCategory && (
                    <button
                      onClick={() => setIsAddingCategory(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FolderPlusIcon className="h-5 w-5 mr-2" />
                      Add Category
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {items.filter(item => item.category_id === category.id).length} items
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
