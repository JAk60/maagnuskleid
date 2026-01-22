'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ArrowLeftRight
} from 'lucide-react';
import DashboardOverview from '../dashboardOverview';
import SettingsPage from '../SettingsPage';

import ProductsManagement from '../ProductsManagement';
import OrdersManagement from '../OrdersManagement';
import CustomersManagement from '../CustomersManagement';
import AnalyticsPage from '../AnalyticsPage';
import CategoryManagement from '../CategoriesManagement';
import ExchangeManagement from '../ExchangeManagement';
import StockAlerts from '../StockAlerts';
export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [adminName, setAdminName] = useState('Admin User');
  const [notifications, setNotifications] = useState(3);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'exchanges', label: 'Exchanges', icon: ArrowLeftRight },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'stocks', label: 'Stock Alerts', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        router.push('/admin/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'products':
        return <ProductsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'exchanges':
        return <ExchangeManagement />;
      case 'customers':
        return <CustomersManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'stocks':
        return <StockAlerts />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-600 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-gray-900">Maagnus Kleid Admin</h1>
              </div>
            </div>


            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {adminName.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900">{adminName}</div>
                  <div className="text-xs text-gray-500">Super Admin</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-20 h-screen pt-20 transition-transform bg-white border-r border-gray-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-64`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    className={`flex items-center w-full p-3 rounded-lg transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="ml-3">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`pt-20 transition-all ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <main className="p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}