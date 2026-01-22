// app/admin/ExchangeManagement.tsx - SIMPLIFIED (NO PAYMENT/REFUND)

'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Eye,
  Search,
  Package
} from 'lucide-react';

interface ExchangeRequest {
  id: string;
  order_id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  original_items: any[];
  requested_items: any[];
  exchange_type: 'size' | 'color';
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  admin_notes?: string;
  tracking_number?: string;
}

export default function ExchangeManagement() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<ExchangeRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'ship' | 'complete'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchExchanges();
  }, [filterStatus]);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' 
        ? '/api/admin/exchanges'
        : `/api/admin/exchanges?status=${filterStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setExchanges(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (
    exchange: ExchangeRequest, 
    action: 'approve' | 'reject' | 'ship' | 'complete'
  ) => {
    setSelectedExchange(exchange);
    setActionType(action);
    setAdminNotes('');
    setTrackingNumber('');
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (!selectedExchange) return;

    let newStatus = selectedExchange.status;
    
    // Validation
    if (actionType === 'reject' && !adminNotes) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    if (actionType === 'ship' && !trackingNumber) {
      alert('Please provide a tracking number');
      return;
    }

    // Determine new status
    switch (actionType) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'ship':
        newStatus = 'shipped';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/admin/exchanges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedExchange.id,
          status: newStatus,
          admin_notes: adminNotes || undefined,
          tracking_number: trackingNumber || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Exchange ${actionType}d successfully!`);
        setShowActionModal(false);
        fetchExchanges();
      } else {
        alert(data.error || 'Failed to update exchange');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Failed to update exchange');
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = (exchange: ExchangeRequest) => {
    setSelectedExchange(exchange);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      completed: <Package className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
  };

  const filteredExchanges = exchanges.filter(exchange => {
    const matchesSearch = 
      exchange.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const stats = {
    pending: exchanges.filter(e => e.status === 'pending').length,
    approved: exchanges.filter(e => e.status === 'approved').length,
    shipped: exchanges.filter(e => e.status === 'shipped').length,
    completed: exchanges.filter(e => e.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exchange Management</h1>
        <p className="text-gray-600 mt-1">Manage size and color exchange requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Pending Review</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Ready to Ship</span>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Shipped</span>
            <Truck className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.shipped}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completed</span>
            <Package className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Exchanges Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                      Loading exchanges...
                    </div>
                  </td>
                </tr>
              ) : filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No exchange requests found
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((exchange) => (
                  <tr key={exchange.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">#{exchange.order_number}</div>
                      <div className="text-xs text-gray-500">{exchange.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{exchange.customer_name}</div>
                      <div className="text-xs text-gray-500">{exchange.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                        {exchange.exchange_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(exchange.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exchange.status)}`}>
                        {getStatusIcon(exchange.status)}
                        {exchange.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => viewDetails(exchange)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {exchange.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(exchange, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(exchange, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {exchange.status === 'approved' && (
                          <button
                            onClick={() => handleAction(exchange, 'ship')}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Mark as Shipped"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        
                        {exchange.status === 'shipped' && (
                          <button
                            onClick={() => handleAction(exchange, 'complete')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Mark as Completed"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Exchange Request Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer & Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold">{selectedExchange.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedExchange.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-semibold">#{selectedExchange.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exchange Type</p>
                  <p className="font-semibold capitalize">{selectedExchange.exchange_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedExchange.status)}`}>
                    {getStatusIcon(selectedExchange.status)}
                    {selectedExchange.status}
                  </span>
                </div>
              </div>

              {/* Original Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Original Items</h3>
                <div className="space-y-2">
                  {selectedExchange.original_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requested Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Requested Items</h3>
                <div className="space-y-2">
                  {selectedExchange.requested_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                      <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Reason</h3>
                <p className="text-gray-700">{selectedExchange.reason}</p>
                {selectedExchange.description && (
                  <p className="text-sm text-gray-600 mt-2">{selectedExchange.description}</p>
                )}
              </div>

              {/* Admin Notes */}
              {selectedExchange.admin_notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <p className="text-sm">{selectedExchange.admin_notes}</p>
                </div>
              )}

              {/* Tracking Number */}
              {selectedExchange.tracking_number && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Tracking Number</h3>
                  <p className="text-sm font-mono">{selectedExchange.tracking_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {actionType === 'approve' && 'Approve Exchange'}
              {actionType === 'reject' && 'Reject Exchange'}
              {actionType === 'ship' && 'Mark as Shipped'}
              {actionType === 'complete' && 'Complete Exchange'}
            </h2>

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Explain why this exchange is being rejected..."
                  required
                />
              </div>
            )}

            {actionType === 'ship' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tracking Number *</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter tracking number..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            {(actionType === 'approve' || actionType === 'complete') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Any notes for this action..."
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={processing}
                className={`flex-1 py-2 text-white rounded-lg font-semibold ${
                  actionType === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}