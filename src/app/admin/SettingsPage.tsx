'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  Database, 
  Cloud, 
  AlertCircle,
  CheckCircle,
  HardDrive,
  Zap
} from 'lucide-react';

interface CloudinaryUsage {
  images: { used: number; limit: number; percentage: number };
  storage: { used: number; limit: number; percentage: number };
  bandwidth: { used: number; limit: number; percentage: number };
  transformations: { used: number; limit: number; percentage: number };
}

interface SupabaseUsage {
  rows: { used: number; limit: number; percentage: number };
  storage: { used: number; limit: number; percentage: number };
  bandwidth: { used: number; limit: number; percentage: number };
  tables: any;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [cloudinaryUsage, setCloudinaryUsage] = useState<CloudinaryUsage | null>(null);
  const [supabaseUsage, setSupabaseUsage] = useState<SupabaseUsage | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (activeTab === 'quota') {
      fetchUsageData();
    }
  }, [activeTab]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const [cloudinaryRes, supabaseRes] = await Promise.all([
        fetch('/api/admin/cloudinary-usage'),
        fetch('/api/admin/supabase-usage')
      ]);

      const cloudinaryData = await cloudinaryRes.json();
      const supabaseData = await supabaseRes.json();

      if (cloudinaryData.success) {
        setCloudinaryUsage(cloudinaryData.data);
      }
      if (supabaseData.success) {
        setSupabaseUsage(supabaseData.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const UsageBar = ({ label, used, limit, unit, percentage }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${getProgressColor(percentage)} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className={`font-semibold px-2 py-1 rounded ${getUsageColor(percentage)}`}>
          {percentage.toFixed(1)}% used
        </span>
        <span className="text-gray-500">
          {(limit - used).toLocaleString()} {unit} remaining
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your store settings and configurations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['general', 'quota', 'advanced'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Store Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  defaultValue="Maagnus Kleid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Email
                </label>
                <input
                  type="email"
                  defaultValue="admin@maagnuskleid.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <textarea
                  rows={3}
                  defaultValue="Premium clothing and accessories"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  defaultValue="rzp_test_xxxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Configure in environment variables</p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">Payment gateway is connected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quota Management */}
      {activeTab === 'quota' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading usage data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cloudinary Usage */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Cloud className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Cloudinary Usage</h2>
                    <p className="text-sm text-gray-600">Free tier limits and usage</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {cloudinaryUsage && (
                    <>
                      <UsageBar
                        label="Images Stored"
                        used={cloudinaryUsage.images.used}
                        limit={cloudinaryUsage.images.limit}
                        unit="images"
                        percentage={cloudinaryUsage.images.percentage}
                      />
                      <UsageBar
                        label="Storage Used"
                        used={cloudinaryUsage.storage.used}
                        limit={cloudinaryUsage.storage.limit}
                        unit="GB"
                        percentage={cloudinaryUsage.storage.percentage}
                      />
                      <UsageBar
                        label="Bandwidth"
                        used={cloudinaryUsage.bandwidth.used}
                        limit={cloudinaryUsage.bandwidth.limit}
                        unit="GB"
                        percentage={cloudinaryUsage.bandwidth.percentage}
                      />
                      <UsageBar
                        label="Transformations"
                        used={cloudinaryUsage.transformations.used}
                        limit={cloudinaryUsage.transformations.limit}
                        unit="transforms"
                        percentage={cloudinaryUsage.transformations.percentage}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Supabase Usage */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Supabase Usage</h2>
                    <p className="text-sm text-gray-600">Database and storage metrics</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {supabaseUsage && (
                    <>
                      <UsageBar
                        label="Database Rows"
                        used={supabaseUsage.rows.used}
                        limit={supabaseUsage.rows.limit}
                        unit="rows"
                        percentage={supabaseUsage.rows.percentage}
                      />
                      <UsageBar
                        label="Storage"
                        used={supabaseUsage.storage.used}
                        limit={supabaseUsage.storage.limit}
                        unit="MB"
                        percentage={supabaseUsage.storage.percentage}
                      />

                      {/* Table Breakdown */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-3">Table Breakdown</p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(supabaseUsage.tables).map(([table, count]: any) => (
                            <div key={table} className="flex justify-between text-sm">
                              <span className="text-gray-600">{table}</span>
                              <span className="font-semibold text-gray-900">{count} rows</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Optimization Tips</h2>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-white/80">•</span>
                    <span>Compress images before uploading to save storage space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/80">•</span>
                    <span>Archive old orders to reduce database size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/80">•</span>
                    <span>Use Cloudinary transformations wisely to stay within limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/80">•</span>
                    <span>Monitor usage regularly to avoid hitting free tier limits</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Database Management</h2>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Caution Required</p>
                  <p className="text-sm text-yellow-800">
                    These actions can permanently affect your data. Use with care.
                  </p>
                </div>
              </div>
              
              <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center justify-between">
                <span className="font-medium">Backup Database</span>
                <Database className="w-5 h-5" />
              </button>
              
              <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left flex items-center justify-between">
                <span className="font-medium">Clear Cache</span>
                <Zap className="w-5 h-5" />
              </button>
              
              <button className="w-full px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-left flex items-center justify-between">
                <span className="font-medium">Delete Old Orders</span>
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">System Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Platform</p>
                <p className="font-semibold">Next.js 14</p>
              </div>
              <div>
                <p className="text-gray-600">Database</p>
                <p className="font-semibold">Supabase PostgreSQL</p>
              </div>
              <div>
                <p className="text-gray-600">Storage</p>
                <p className="font-semibold">Cloudinary</p>
              </div>
              <div>
                <p className="text-gray-600">Payments</p>
                <p className="font-semibold">Razorpay</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}