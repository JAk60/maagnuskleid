// components/ExchangeRequestForm.tsx - SIZE/COLOR ONLY

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, AlertCircle, CheckCircle, Package, X } from 'lucide-react';

interface ExchangeRequestFormProps {
  order: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ExchangeRequestForm({ order, onClose, onSuccess }: ExchangeRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  
  // Form state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [exchangeType, setExchangeType] = useState<'size' | 'color' | ''>('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const reasons = {
    size: [
      'Wrong size ordered',
      'Size doesn\'t fit',
      'Need different size',
      'Size runs small/large',
      'Other'
    ],
    color: [
      'Wrong color ordered',
      'Color looks different than photo',
      'Prefer different color',
      'Color not as expected',
      'Other'
    ]
  };

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const response = await fetch(
        `/api/exchanges/eligibility?orderId=${order.id}&userId=${order.user_id}`
      );
      const data = await response.json();
      setEligibility(data);
    } catch (error) {
      console.error('Eligibility check failed:', error);
      setEligibility({ 
        eligible: false, 
        reason: 'Failed to check eligibility' 
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) {
      alert('Please select an item to exchange');
      return;
    }

    if (!exchangeType) {
      alert('Please select exchange type (size or color)');
      return;
    }

    if (exchangeType === 'size' && !newSize) {
      alert('Please select a new size');
      return;
    }

    if (exchangeType === 'color' && !newColor) {
      alert('Please select a new color');
      return;
    }

    if (!reason) {
      alert('Please select a reason');
      return;
    }

    // Validate that something is actually changing
    if (exchangeType === 'size' && newSize === selectedItem.size) {
      alert('Please select a different size');
      return;
    }

    if (exchangeType === 'color' && newColor === selectedItem.color) {
      alert('Please select a different color');
      return;
    }

    setLoading(true);

    try {
      // Prepare exchange data
      const originalItem = {
        order_item_id: selectedItem.id || `item-${Date.now()}`,
        product_id: selectedItem.product_id,
        product_name: selectedItem.product_name,
        product_image: selectedItem.product_image,
        size: selectedItem.size,
        color: selectedItem.color,
        quantity: selectedItem.quantity,
        original_price: selectedItem.price
      };

      const requestedItem = {
        ...originalItem,
        size: exchangeType === 'size' ? newSize : selectedItem.size,
        color: exchangeType === 'color' ? newColor : selectedItem.color,
        current_price: selectedItem.price // Same product = same price
      };

      const exchangeData = {
        order_id: order.id,
        user_id: order.user_id,
        original_items: [originalItem],
        requested_items: [requestedItem],
        exchange_type: exchangeType,
        reason: reason,
        description: description || ''
      };

      const response = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exchangeData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Exchange request submitted successfully! Our team will review it shortly.');
        onSuccess?.();
        onClose();
      } else {
        alert(result.error || 'Failed to submit exchange request');
      }
    } catch (error) {
      console.error('Exchange submission error:', error);
      alert('Failed to submit exchange request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Exchange Not Available</h3>
            <p className="text-red-800">{eligibility?.reason}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-blue-600" />
          Request Exchange
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Eligibility Info */}
      {eligibility.daysRemaining !== null && (
        <div className={`border rounded-lg p-4 ${
          eligibility.daysRemaining <= 5 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
              eligibility.daysRemaining <= 5 ? 'text-orange-600' : 'text-green-600'
            }`} />
            <div>
              <p className={`font-semibold ${
                eligibility.daysRemaining <= 5 ? 'text-orange-900' : 'text-green-900'
              }`}>
                {eligibility.daysRemaining} days remaining to exchange
              </p>
              <p className={`text-sm mt-1 ${
                eligibility.daysRemaining <= 5 ? 'text-orange-700' : 'text-green-700'
              }`}>
                Exchanges must be requested within 30 days of delivery
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">Exchange Policy</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You can only exchange for the <strong>same product</strong></li>
              <li>• Change size OR color (or both)</li>
              <li>• <strong>No additional charge</strong> for same product exchanges</li>
              <li>• Original item must be unworn with tags attached</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Select Item */}
        <div>
          <label className="block text-sm font-medium mb-3">Select Item to Exchange</label>
          <div className="space-y-3">
            {order.items.map((item: any, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedItem(item)}
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedItem === item
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedItem === item
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-300'
                }`}>
                  {selectedItem === item && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                
                <img
                  src={item.product_image || '/placeholder.jpg'}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product_name}</h3>
                  <p className="text-sm text-gray-600">
                    Size: <span className="font-medium">{item.size}</span> | 
                    Color: <span className="font-medium">{item.color}</span>
                  </p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedItem && (
          <>
            {/* Exchange Type */}
            <div>
              <label className="block text-sm font-medium mb-3">What would you like to change?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setExchangeType('size');
                    setNewColor('');
                  }}
                  className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                    exchangeType === 'size'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Change Size
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setExchangeType('color');
                    setNewSize('');
                  }}
                  className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                    exchangeType === 'color'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Change Color
                </button>
              </div>
            </div>

            {/* Size Selection */}
            {exchangeType === 'size' && (
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select New Size (Currently: {selectedItem.size})
                </label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setNewSize(size)}
                      disabled={size === selectedItem.size}
                      className={`px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
                        newSize === size
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : size === selectedItem.size
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {size}
                      {size === selectedItem.size && ' (Current)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {exchangeType === 'color' && (
              <div>
                <label className="block text-sm font-medium mb-3">
                  Select New Color (Currently: {selectedItem.color})
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      disabled={color === selectedItem.color}
                      className={`px-4 py-2 border-2 rounded-lg font-semibold transition-all ${
                        newColor === color
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : color === selectedItem.color
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {color}
                      {color === selectedItem.color && ' (Current)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-3">Reason for Exchange *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a reason</option>
                {exchangeType && reasons[exchangeType]?.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-3">Additional Details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Any additional information about your exchange request..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            {(newSize || newColor) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Exchange Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Current</p>
                    <p className="font-medium">
                      Size: {selectedItem.size}<br />
                      Color: {selectedItem.color}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">New</p>
                    <p className="font-medium">
                      Size: {newSize || selectedItem.size}<br />
                      Color: {newColor || selectedItem.color}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Additional Charge:</span>
                    <span className="text-lg font-bold text-green-600">₹0.00 (FREE)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !exchangeType || (!newSize && !newColor)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Submit Exchange Request
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}