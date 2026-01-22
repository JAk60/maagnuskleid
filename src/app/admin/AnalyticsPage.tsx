'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: any[];
  recentSales: any[];
  monthlyRevenue: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
      change: analytics?.revenueGrowth || 0,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: analytics?.ordersGrowth || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Customers',
      value: analytics?.totalCustomers || 0,
      change: analytics?.customersGrowth || 0,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Products',
      value: analytics?.totalProducts || 0,
      change: 0,
      icon: Package,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your store's performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                {stat.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
          </div>
          <div className="p-6">
            {analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <img
                      src={product.image_url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales_count} sold</p>
                    </div>
                    <p className="font-bold text-gray-900">₹{(product.revenue || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Sales Activity</h2>
          </div>
          <div className="p-6">
            {analytics?.recentSales && analytics.recentSales.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{sale.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {sale.customer_name} • {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{sale.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{sale.items_count} items</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No recent sales</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart (Simple Bar Chart) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue Trend</h2>
        {analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
          <div className="space-y-4">
            {analytics.monthlyRevenue.map((month, index) => {
              const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue));
              const widthPercentage = (month.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-600">
                    {month.month}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-blue-500 to-purple-600 h-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        <span className="text-white font-semibold text-sm">
                          ₹{month.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600">
                    {month.orders} orders
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No revenue data available</p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-white/80 mb-1">Average Order Value</p>
            <p className="text-2xl font-bold">
              ₹{analytics?.totalOrders && analytics?.totalRevenue 
                ? Math.round(analytics.totalRevenue / analytics.totalOrders).toLocaleString()
                : 0}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-white/80 mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold">
              {analytics?.totalCustomers && analytics?.totalOrders
                ? ((analytics.totalOrders / analytics.totalCustomers) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-white/80 mb-1">Customer Lifetime Value</p>
            <p className="text-2xl font-bold">
              ₹{analytics?.totalCustomers && analytics?.totalRevenue
                ? Math.round(analytics.totalRevenue / analytics.totalCustomers).toLocaleString()
                : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}