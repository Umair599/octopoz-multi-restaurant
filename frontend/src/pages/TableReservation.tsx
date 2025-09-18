import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Restaurant {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
}

interface ReservationFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests: string;
}

export default function TableReservation() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPartySize, setSelectedPartySize] = useState(2);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReservationFormData>();

  const watchedDate = watch('reservation_date');
  const watchedPartySize = watch('party_size');

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (watchedDate && watchedPartySize) {
      fetchAvailableSlots(watchedDate, watchedPartySize);
    }
  }, [watchedDate, watchedPartySize]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/public`);
      const restaurants = await response.json();
      const currentRestaurant = restaurants.find((r: Restaurant) => r.id === restaurantId);
      setRestaurant(currentRestaurant);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: string, partySize: number) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/${restaurantId}/available-slots?date=${date}&party_size=${partySize}`
      );
      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  const onSubmit = async (data: ReservationFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:4000/api/${restaurantId}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Reservation confirmed! Table ${result.table_number}`);
        // Reset form or redirect
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to make reservation');
      }
    } catch (error) {
      console.error('Error making reservation:', error);
      toast.error('Failed to make reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from today
    return maxDate.toISOString().split('T')[0];
  };

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
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <p className="text-sm text-gray-500">Table Reservation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserve a Table</h2>
            <p className="text-gray-600">
              Book your table at {restaurant.name} and enjoy a great dining experience.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('customer_name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
                {errors.customer_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...register('customer_email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
                {errors.customer_email && (
                  <p className="text-red-600 text-sm mt-1">{errors.customer_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('customer_phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Size *
                </label>
                <select
                  {...register('party_size', { required: 'Party size is required', valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
                {errors.party_size && (
                  <p className="text-red-600 text-sm mt-1">{errors.party_size.message}</p>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('reservation_date', { required: 'Date is required' })}
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.reservation_date && (
                <p className="text-red-600 text-sm mt-1">{errors.reservation_date.message}</p>
              )}
            </div>

            {/* Time Selection */}
            {watchedDate && availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map(slot => (
                    <label key={slot} className="relative">
                      <input
                        {...register('reservation_time', { required: 'Time is required' })}
                        type="radio"
                        value={slot}
                        className="sr-only peer"
                      />
                      <div className="p-3 text-center border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 peer-checked:bg-blue-100 peer-checked:border-blue-500 peer-checked:text-blue-700">
                        <ClockIcon className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-sm font-medium">{formatTimeSlot(slot)}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.reservation_time && (
                  <p className="text-red-600 text-sm mt-1">{errors.reservation_time.message}</p>
                )}
              </div>
            )}

            {watchedDate && availableSlots.length === 0 && (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Slots</h3>
                <p className="text-gray-500">
                  No available time slots for {watchedPartySize} {watchedPartySize === 1 ? 'person' : 'people'} on this date.
                  Please try a different date or party size.
                </p>
              </div>
            )}

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                {...register('special_requests')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requests or dietary requirements..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || availableSlots.length === 0}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Making Reservation...' : 'Reserve Table'}
              </button>
            </div>
          </form>
        </div>

        {/* Restaurant Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Information</h3>
          <div className="space-y-2">
            {restaurant.address && (
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> {restaurant.address}
              </p>
            )}
            {restaurant.phone && (
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {restaurant.phone}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
