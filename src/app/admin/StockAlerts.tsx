// ========================================
// components/admin/StockAlerts.tsx
// Shows low stock and out of stock alerts
// ========================================

"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, XCircle, Package } from 'lucide-react'

interface Product {
  id: number
  name: string
  stock: number
  image_url: string
  price: number
}

export default function StockAlerts() {
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [outOfStock, setOutOfStock] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStockAlerts()
  }, [])

  const loadStockAlerts = async () => {
    try {
      // Get low stock products
      const lowRes = await fetch('/api/inventory?type=low-stock')
      const lowData = await lowRes.json()
      if (lowData.success) {
        setLowStock(lowData.data)
      }

      // Get out of stock products
      const outRes = await fetch('/api/inventory?type=out-of-stock')
      const outData = await outRes.json()
      if (outData.success) {
        setOutOfStock(outData.data)
      }
    } catch (error) {
      console.error('Failed to load stock alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const totalAlerts = lowStock.length + outOfStock.length

  if (totalAlerts === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stock Alerts
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-600 font-semibold">All products are well stocked!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Stock Alerts
        </h2>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
          {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {/* Out of Stock - Critical */}
        {outOfStock.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-red-700">Out of Stock ({outOfStock.length})</h3>
            </div>
            <div className="space-y-2">
              {outOfStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">₹{product.price}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">
                    0 LEFT
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock - Warning */}
        {lowStock.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-orange-700">Low Stock ({lowStock.length})</h3>
            </div>
            <div className="space-y-2">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">₹{product.price}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-bold">
                    {product.stock} LEFT
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={loadStockAlerts}
        className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        Refresh Alerts
      </button>
    </div>
  )
}