import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ShippingAddress {
    first_name: string;
    last_name: string;
    city: string;
}

interface Order {
    id: string;
    order_number: string;
    created_at: string;
    shipping_address?: ShippingAddress;
    total: number;
    order_status: string;
    payment_status: string;
    shiprocket_order_id?: string;
    shiprocket_status?: string;
    awb_number?: string;
    courier_name?: string;
    tracking_url?: string;
    shipped_at?: string;
    delivered_at?: string;
}

interface ShipRocketLog {
    id: string;
    order_id: string;
    action: string;
    status: string;
    error_message?: string;
    created_at: string;
}

export default function ShipRocketManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [logs, setLogs] = useState<ShipRocketLog[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today');
    const [showLogs, setShowLogs] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select('*')
                .eq('payment_status', 'paid')
                .order('created_at', { ascending: false });

            if (filter === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (filter === 'not_synced') {
                query = query.is('shiprocket_order_id', null);
            } else if (filter === 'synced') {
                query = query.not('shiprocket_order_id', 'is', null);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const fetchLogs = useCallback(async (orderId: string) => {
        try {
            const { data, error } = await supabase
                .from('shiprocket_logs')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        
        // Auto-refresh every 30 seconds to catch webhook updates
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const viewLogs = async (orderId: string) => {
        setSelectedOrderId(orderId);
        await fetchLogs(orderId);
        setShowLogs(true);
    };

    const openShipRocket = (orderId?: string) => {
        const baseUrl = 'https://app.shiprocket.in/seller/orders';
        if (orderId) {
            // Open ShipRocket and search for specific order
            window.open(`${baseUrl}?search=${orderId}`, '_blank');
        } else {
            // Open ShipRocket orders page
            window.open(baseUrl, '_blank');
        }
    };

    const getStatusBadge = (order: Order) => {
        if (order.shiprocket_order_id) {
            return (
                <div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Synced
                    </span>
                    {order.shiprocket_status && (
                        <div className="text-xs text-gray-500 mt-1">{order.shiprocket_status}</div>
                    )}
                </div>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Not Synced
            </span>
        );
    };

    const getOrderStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-gray-100 text-gray-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status?.toUpperCase()}
            </span>
        );
    };

    const readyToShipCount = orders.filter(o => o.shiprocket_order_id && !o.awb_number).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking Dashboard</h1>
                    <p className="text-gray-600">Monitor orders and shipping status (Process shipments in ShipRocket)</p>
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex gap-4 items-center justify-between flex-wrap">
                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={() => setFilter('today')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Today s Orders
                            </button>
                            <button
                                onClick={() => setFilter('not_synced')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === 'not_synced' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Not Synced
                            </button>
                            <button
                                onClick={() => setFilter('synced')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === 'synced' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Synced
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All Orders
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchOrders}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => openShipRocket()}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
                            >
                                <span>🚀</span>
                                Open ShipRocket
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alert if orders need attention */}
                {readyToShipCount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-yellow-900 mb-1">
                                    {readyToShipCount} {readyToShipCount === 1 ? 'order needs' : 'orders need'} AWB generation
                                </h3>
                                <p className="text-sm text-yellow-800 mb-2">
                                    Go to ShipRocket dashboard to generate AWB and print labels
                                </p>
                                <button
                                    onClick={() => openShipRocket()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700"
                                >
                                    Process in ShipRocket →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Total Orders</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900">{orders.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Ready to Ship</div>
                        <div className="mt-2 text-3xl font-bold text-yellow-600">{readyToShipCount}</div>
                        <div className="text-xs text-gray-500 mt-1">Process in ShipRocket →</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Shipped</div>
                        <div className="mt-2 text-3xl font-bold text-blue-600">
                            {orders.filter(o => o.awb_number).length}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-500">Revenue</div>
                        <div className="mt-2 text-3xl font-bold text-green-600">
                            ₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No orders found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ShipRocket Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                                                <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                                                </div>
                                                <div className="text-xs text-gray-500">{order.shipping_address?.city}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ₹{order.total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getOrderStatusBadge(order.payment_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(order)}
                                                {order.shiprocket_order_id && (
                                                    <div className="text-xs text-gray-500 mt-1">ID: {order.shiprocket_order_id}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.awb_number ? (
                                                    <div>
                                                        <div className="text-sm font-mono text-gray-900">{order.awb_number}</div>
                                                        {order.courier_name && (
                                                            <div className="text-xs text-gray-500">{order.courier_name}</div>
                                                        )}
                                                        {order.tracking_url && (
                                                            <a
                                                                href={order.tracking_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline"
                                                            >
                                                                Track Package →
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : order.shiprocket_order_id ? (
                                                    <div className="text-xs text-yellow-600 font-medium">
                                                        ⚠️ Generate AWB in ShipRocket
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Pending Sync</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => openShipRocket(order.shiprocket_order_id)}
                                                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                                                    >
                                                        View in ShipRocket
                                                    </button>
                                                    <button
                                                        onClick={() => viewLogs(order.id)}
                                                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                                                    >
                                                        View Logs
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">How to Process Shipments</h3>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Click &quot;Open ShipRocket&quot; button above to open ShipRocket dashboard</li>
                                <li>Go to Orders → New tab (all synced orders will be there)</li>
                                <li>Select orders and click &quot;Ship Now&quot; button</li>
                                <li>Choose recommended courier and confirm</li>
                                <li>Print shipping labels from ShipRocket</li>
                                <li>Pack orders with printed labels</li>
                                <li>Schedule pickup in ShipRocket (bulk pickup available)</li>
                                <li>Hand over packages when courier arrives</li>
                                <li>Status updates will automatically appear here via webhooks!</li>
                            </ol>
                            <p className="text-xs text-blue-700 mt-2">
                                💡 This dashboard auto-refreshes every 30 seconds to show latest status
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logs Modal */}
                {showLogs && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">ShipRocket Logs</h2>
                                    <button
                                        onClick={() => setShowLogs(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                                {logs.length === 0 ? (
                                    <p className="text-gray-500 text-center">No logs found for this order</p>
                                ) : (
                                    <div className="space-y-4">
                                        {logs.map((log) => (
                                            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            log.status === 'success'
                                                                ? 'bg-green-100 text-green-800'
                                                                : log.status === 'error'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {log.status}
                                                    </span>
                                                </div>
                                                {log.error_message && (
                                                    <p className="text-sm text-red-600 mb-2">{log.error_message}</p>
                                                )}
                                                <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}