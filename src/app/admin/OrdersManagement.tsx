'use client';

import { Download, Eye, Search, X, ChevronDown, Package, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  product_image: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  subtotal: number;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  shipping_address: ShippingAddress;
  payment_method: 'razorpay' | 'cod' | string;
  payment_status: string;
  order_status: string;
  created_at: string;
  razorpay_payment_id?: string;
  cod_charge?: number;
  // Shiprocket fields
  awb_number?: string;
  courier_name?: string;
  expected_delivery_date?: string;
  shiprocket_status?: string;
}

interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  error?: string;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_in_transit', 'returned', 'lost', 'damaged'];
const TAX_RATE = 0.05;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    delivered:        { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
    out_for_delivery: { bg: 'bg-cyan-50',     text: 'text-cyan-700',    dot: 'bg-cyan-500' },
    shipped:          { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500' },
    processing:       { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
    ready_to_ship:    { bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500' },
    confirmed:        { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-500' },
    cancelled:        { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-400' },
    return_in_transit:{ bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
    returned:         { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
    lost:             { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500' },
    damaged:          { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500' },
    pending:          { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  };
  return map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

function StatusBadge({ status }: { status: string }) {
  const s = getStatusStyle(status);
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function PaymentPill({ method, codCharge }: { method: string; codCharge?: number }) {
  const isCOD = method === 'cod';
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
        isCOD
          ? 'bg-orange-100 text-orange-700'
          : 'bg-emerald-100 text-emerald-700'
      }`}>
        <span>{isCOD ? '💵' : '✅'}</span>
        {isCOD ? 'Cash on Delivery' : 'Paid Online'}
      </span>
      {isCOD && codCharge && codCharge > 0 && (
        <span className="text-xs text-orange-500 pl-1">+₹{codCharge} COD fee</span>
      )}
    </div>
  );
}

function EDDLabel({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const isPast = d < today;
  return (
    <div className={`flex items-center gap-1 text-xs mt-1 ${isPast ? 'text-red-500' : 'text-gray-400'}`}>
      <Truck className="w-3 h-3" />
      <span>EDD: {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportToCSV(orders: Order[]) {
  const headers = [
    'Order Number', 'Date', 'Customer', 'Phone',
    'Payment Method', 'Order Status', 'Total (₹)',
    'Items', 'City', 'State', 'AWB', 'Courier', 'EDD',
  ];
  const rows = orders.map(o => [
    o.order_number,
    new Date(o.created_at).toLocaleDateString(),
    `${o.shipping_address?.first_name ?? ''} ${o.shipping_address?.last_name ?? ''}`.trim(),
    o.shipping_address?.phone ?? '',
    o.payment_method?.toUpperCase() ?? '',
    o.order_status,
    o.total,
    o.items?.length ?? 0,
    o.shipping_address?.city ?? '',
    o.shipping_address?.state ?? '',
    o.awb_number ?? '',
    o.courier_name ?? '',
    o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : '',
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrdersManagement() {
  const [orders,         setOrders]         = useState<Order[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [selectedOrder,  setSelectedOrder]  = useState<Order | null>(null);
  const [showDetails,    setShowDetails]    = useState(false);

  // Override modal (inside detail view)
  const [overrideModal,    setOverrideModal]    = useState<{ order: Order; newStatus: string } | null>(null);
  const [overrideUpdating, setOverrideUpdating] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res  = await fetch('/api/admin/orders');
      const data = (await res.json()) as OrdersApiResponse;
      if (!data.success) throw new Error(data.error ?? 'Failed to fetch orders');
      setOrders(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Override ───────────────────────────────────────────────────────────────

  const applyOverride = async () => {
    if (!overrideModal) return;
    setOverrideUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: overrideModal.order.id, order_status: overrideModal.newStatus }),
      });
      if (res.ok) {
        toast.success(`Order marked as ${overrideModal.newStatus.replace(/_/g, ' ')}`);
        // Update local state so detail modal reflects change immediately
        const updated = orders.map(o =>
          o.id === overrideModal.order.id ? { ...o, order_status: overrideModal.newStatus } : o
        );
        setOrders(updated);
        if (selectedOrder?.id === overrideModal.order.id) {
          setSelectedOrder({ ...selectedOrder, order_status: overrideModal.newStatus });
        }
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setOverrideUpdating(false);
      setOverrideModal(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      o.order_number?.toLowerCase().includes(q) ||
      o.shipping_address?.first_name?.toLowerCase().includes(q) ||
      o.shipping_address?.last_name?.toLowerCase().includes(q) ||
      o.shipping_address?.phone?.includes(q);
    const matchStatus = filterStatus === 'all' || o.order_status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''} · auto-updated via Shiprocket
          </p>
        </div>
        <button
          onClick={() => exportToCSV(filtered)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters — search + status only */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, name, or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 bg-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Loading orders…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(order => {
                  const isCOD = order.payment_method === 'cod';
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50/80 transition-colors ${isCOD ? 'bg-orange-50/40' : ''}`}
                    >
                      {/* Order */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 font-mono text-xs">
                          #{order.order_number}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                        </div>
                        <div className="text-xs text-gray-400">{order.shipping_address?.phone}</div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">₹{order.total.toLocaleString()}</div>
                      </td>

                      {/* Payment — single pill */}
                      <td className="px-5 py-4">
                        <PaymentPill method={order.payment_method} codCharge={order.cod_charge} />
                      </td>

                      {/* Status — badge only, Shiprocket updates this */}
                      <td className="px-5 py-4">
                        <StatusBadge status={order.order_status} />
                        {order.expected_delivery_date && (
                          <EDDLabel date={order.expected_delivery_date} />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Override Confirmation Modal ──────────────────────────────────── */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Manual Status Override</h2>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              ⚠️ Shiprocket normally handles this automatically. Only override for edge cases.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Change <span className="font-semibold">#{overrideModal.order.order_number}</span> to{' '}
              <StatusBadge status={overrideModal.newStatus} />?
            </p>

            {/* COD + delivered warning */}
            {overrideModal.newStatus === 'delivered' &&
             overrideModal.order.payment_method === 'cod' && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                💵 COD order — confirm you have collected cash before marking as delivered.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOverrideModal(null)}
                disabled={overrideUpdating}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyOverride}
                disabled={overrideUpdating}
                className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {overrideUpdating
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</>
                  : 'Confirm Override'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ───────────────────────────────────────────── */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">#{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Status row */}
              <div className="flex flex-wrap gap-3 items-center">
                <PaymentPill method={selectedOrder.payment_method} codCharge={selectedOrder.cod_charge} />
                <StatusBadge status={selectedOrder.order_status} />
                {selectedOrder.expected_delivery_date && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    EDD: {new Date(selectedOrder.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Shiprocket tracking info */}
              {(selectedOrder.awb_number || selectedOrder.courier_name) && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-blue-700 mb-1.5">📦 Shiprocket Tracking</p>
                  {selectedOrder.courier_name && (
                    <div className="flex gap-2 text-blue-900">
                      <span className="text-blue-500 w-16 shrink-0">Courier</span>
                      <span className="font-medium">{selectedOrder.courier_name}</span>
                    </div>
                  )}
                  {selectedOrder.awb_number && (
                    <div className="flex gap-2 text-blue-900">
                      <span className="text-blue-500 w-16 shrink-0">AWB</span>
                      <span className="font-mono font-medium">{selectedOrder.awb_number}</span>
                    </div>
                  )}
                  {selectedOrder.shiprocket_status && (
                    <div className="flex gap-2 text-blue-900">
                      <span className="text-blue-500 w-16 shrink-0">Raw</span>
                      <span>{selectedOrder.shiprocket_status}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Razorpay ID */}
              {selectedOrder.razorpay_payment_id && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs flex gap-2">
                  <span className="text-indigo-500 shrink-0">Razorpay ID</span>
                  <span className="font-mono text-indigo-800">{selectedOrder.razorpay_payment_id}</span>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Items</p>
                  <p className="font-medium text-gray-900">{selectedOrder.items?.length ?? 0} item{(selectedOrder.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Shipping address */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.shipping_address?.first_name} {selectedOrder.shipping_address?.last_name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{selectedOrder.shipping_address?.phone}</p>
                  <p className="text-gray-600 mt-2 text-xs leading-relaxed">
                    {selectedOrder.shipping_address?.address_line1}
                    {selectedOrder.shipping_address?.address_line2 && `, ${selectedOrder.shipping_address.address_line2}`}
                    <br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.postal_code}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.size} · {item.color} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-gray-900 flex-shrink-0">₹{item.subtotal.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal (excl. tax)</span>
                  <span>₹{Math.round(selectedOrder.total / (1 + TAX_RATE)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (5%)</span>
                  <span>₹{Math.round(Math.round(selectedOrder.total / (1 + TAX_RATE)) * TAX_RATE).toLocaleString()}</span>
                </div>
                {selectedOrder.payment_method === 'cod' && selectedOrder.cod_charge && selectedOrder.cod_charge > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>COD Handling Fee</span>
                    <span>₹{selectedOrder.cod_charge}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-1">
                  <span>Total</span>
                  <span>₹{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* ── Manual Override Section ────────────────────────────── */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manual Override</h3>
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Edge cases only</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Shiprocket updates status automatically. Only use this if something went wrong.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map(s => {
                    const isActive = selectedOrder.order_status === s;
                    const style = getStatusStyle(s);
                    const label = s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <button
                        key={s}
                        onClick={() => !isActive && setOverrideModal({ order: selectedOrder, newStatus: s })}
                        disabled={isActive}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isActive
                            ? `${style.bg} ${style.text} border-transparent ring-2 ring-offset-1 ring-gray-300 cursor-default`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700 cursor-pointer'
                        }`}
                      >
                        {isActive && <span className="mr-1">✓</span>}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}