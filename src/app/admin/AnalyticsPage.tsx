'use client';

import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TopProduct {
  name: string;
  image_url?: string;
  sales_count: number;
  revenue: number;
}

interface RecentSale {
  order_number: string;
  customer_name: string;
  created_at: string;
  total: number;
  items_count: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: TopProduct[];
  recentSales: RecentSale[];
  monthlyRevenue: MonthlyRevenue[];
}

interface AnalyticsApiResponse {
  success: boolean;
  data: AnalyticsData;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
      const data = (await response.json()) as AnalyticsApiResponse;

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
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: analytics?.ordersGrowth || 0,
      icon: ShoppingCart,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Customers',
      value: analytics?.totalCustomers || 0,
      change: analytics?.customersGrowth || 0,
      icon: Users,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Products',
      value: analytics?.totalProducts || 0,
      change: 0,
      icon: Package,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your store&apos;s performance and insights
          </p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;

          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>

                {stat.change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Top Products + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Top Selling Products</h2>
          </div>
          <div className="p-6 space-y-4">
            {analytics?.topProducts.length ? (
              analytics.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <img
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.sales_count} sold
                    </p>
                  </div>
                  <p className="font-bold">
                    ₹{product.revenue.toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">
                No sales data available
              </p>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Recent Sales Activity</h2>
          </div>
          <div className="p-6 space-y-4">
            {analytics?.recentSales.length ? (
              analytics.recentSales.map((sale, index) => (
                <div
                  key={index}
                  className="flex justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      Order #{sale.order_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sale.customer_name} •{' '}
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ₹{sale.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.items_count} items
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">
                No recent sales
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-6">Monthly Revenue Trend</h2>

        {analytics?.monthlyRevenue.length ? (
          analytics.monthlyRevenue.map((month, index) => {
            const maxRevenue = Math.max(
              ...analytics.monthlyRevenue.map((m) => m.revenue)
            );
            const width = (month.revenue / maxRevenue) * 100;

            return (
              <div key={index} className="flex items-center gap-4 mb-4">
                <div className="w-24 text-sm">{month.month}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-600 h-full rounded-full flex items-center justify-end pr-3 text-white text-sm"
                    style={{ width: `${width}%` }}
                  >
                    ₹{month.revenue.toLocaleString()}
                  </div>
                </div>
                <div className="w-20 text-sm text-right">
                  {month.orders} orders
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-6">
            <TrendingUp className="w-10 h-10 mx-auto mb-2" />
            No revenue data available
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm mb-1">Average Order Value</p>
            <p className="text-2xl font-bold">
              ₹
              {analytics?.totalOrders
                ? Math.round(
                    analytics.totalRevenue / analytics.totalOrders
                  ).toLocaleString()
                : 0}
            </p>
          </div>

          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold">
              {analytics?.totalCustomers
                ? (
                    (analytics.totalOrders /
                      analytics.totalCustomers) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm mb-1">Customer Lifetime Value</p>
            <p className="text-2xl font-bold">
              ₹
              {analytics?.totalCustomers
                ? Math.round(
                    analytics.totalRevenue /
                      analytics.totalCustomers
                  ).toLocaleString()
                : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
