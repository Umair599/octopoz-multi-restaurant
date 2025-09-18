import React, { useState } from 'react';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface PaymentFormData {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  cardholder_name: string;
  billing_address: string;
  billing_city: string;
  billing_zip: string;
}

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export default function PaymentForm({ amount, onPaymentSuccess, onCancel }: PaymentFormProps) {
  const [processing, setProcessing] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormData>();

  const onSubmit = async (data: PaymentFormData) => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      // In a real implementation, you would integrate with Stripe, PayPal, or another payment processor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      const paymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;
      
      toast.success('Payment processed successfully!');
      onPaymentSuccess(paymentId);
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CreditCardIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <LockClosedIcon className="h-4 w-4" />
          <span>Secure</span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number *
          </label>
          <input
            {...register('card_number', { 
              required: 'Card number is required',
              pattern: {
                value: /^[0-9\s]{13,19}$/,
                message: 'Invalid card number'
              }
            })}
            type="text"
            maxLength={19}
            placeholder="1234 5678 9012 3456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              e.target.value = formatCardNumber(e.target.value);
            }}
          />
          {errors.card_number && (
            <p className="text-red-600 text-sm mt-1">{errors.card_number.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month *
            </label>
            <select
              {...register('expiry_month', { required: 'Month is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            {errors.expiry_month && (
              <p className="text-red-600 text-sm mt-1">{errors.expiry_month.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <select
              {...register('expiry_year', { required: 'Year is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">YYYY</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.expiry_year && (
              <p className="text-red-600 text-sm mt-1">{errors.expiry_year.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV *
            </label>
            <input
              {...register('cvv', { 
                required: 'CVV is required',
                pattern: {
                  value: /^[0-9]{3,4}$/,
                  message: 'Invalid CVV'
                }
              })}
              type="text"
              maxLength={4}
              placeholder="123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.cvv && (
              <p className="text-red-600 text-sm mt-1">{errors.cvv.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name *
          </label>
          <input
            {...register('cardholder_name', { required: 'Cardholder name is required' })}
            type="text"
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.cardholder_name && (
            <p className="text-red-600 text-sm mt-1">{errors.cardholder_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Billing Address *
          </label>
          <input
            {...register('billing_address', { required: 'Billing address is required' })}
            type="text"
            placeholder="123 Main St"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.billing_address && (
            <p className="text-red-600 text-sm mt-1">{errors.billing_address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              {...register('billing_city', { required: 'City is required' })}
              type="text"
              placeholder="New York"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.billing_city && (
              <p className="text-red-600 text-sm mt-1">{errors.billing_city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              {...register('billing_zip', { required: 'ZIP code is required' })}
              type="text"
              placeholder="10001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.billing_zip && (
              <p className="text-red-600 text-sm mt-1">{errors.billing_zip.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-4 w-4 mr-2" />
                  Pay ${(amount / 100).toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Your payment information is secure and encrypted.</p>
      </div>
    </div>
  );
}
