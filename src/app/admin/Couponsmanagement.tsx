'use client'
// src/app/admin/CouponsManagement.tsx

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'flat' | 'percentage'
  discount_value: number
  min_order_amount: number
  max_total_uses: number | null
  max_uses_per_user: number
  used_count: number
  allow_on_cod: boolean
  is_active: boolean
  valid_from: string
  valid_until: string | null
  created_at: string
}

interface CouponsApiResponse {
  success: boolean
  data?: Coupon[]
  error?: string
}

interface CouponMutationResponse {
  success: boolean
  error?: string
  deactivated?: boolean
  message?: string
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'flat' as 'flat' | 'percentage',
  discount_value: 0,
  min_order_amount: 0,
  max_total_uses: '' as number | '',
  max_uses_per_user: 1,
  allow_on_cod: true,
  is_active: true,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
}

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/coupons')

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = (await res.json()) as CouponsApiResponse
      if (!data.success) throw new Error(data.error ?? 'Unknown API error')
      setCoupons(data.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load coupons'
      toast.error(message)
      console.error('fetchCoupons error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setForm({
        code: coupon.code,
        description: coupon.description ?? '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount,
        max_total_uses: coupon.max_total_uses ?? '',
        max_uses_per_user: coupon.max_uses_per_user,
        allow_on_cod: coupon.allow_on_cod,
        is_active: coupon.is_active,
        valid_from: coupon.valid_from.split('T')[0],
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      })
    } else {
      setEditingCoupon(null)
      setForm(EMPTY_FORM)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCoupon(null)
  }

  const handleSubmit = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return }
    if (!form.discount_value || form.discount_value <= 0) { toast.error('Discount value must be greater than 0'); return }
    if (form.discount_type === 'percentage' && form.discount_value > 100) { toast.error('Percentage cannot exceed 100%'); return }

    setSubmitting(true)
    try {
      const payload = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_total_uses: form.max_total_uses === '' ? null : Number(form.max_total_uses),
        max_uses_per_user: Number(form.max_uses_per_user) || 1,
        allow_on_cod: form.allow_on_cod,
        is_active: form.is_active,
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : new Date().toISOString(),
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      }

      const res = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok && res.status !== 409) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = (await res.json()) as CouponMutationResponse

      if (!data.success) throw new Error(data.error ?? 'Operation failed')

      toast.success(editingCoupon ? 'Coupon updated!' : 'Coupon created!')
      await fetchCoupons()
      closeModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed'
      toast.error(message)
      console.error('handleSubmit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = (await res.json()) as CouponMutationResponse
      if (!data.success) throw new Error(data.error ?? 'Failed to update')
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
      fetchCoupons()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update'
      toast.error(message)
      console.error('handleToggleActive error:', err)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    const message = coupon.used_count > 0
      ? `"${coupon.code}" has been used ${coupon.used_count} time(s) and will be deactivated instead of deleted. Continue?`
      : `Are you sure you want to delete coupon "${coupon.code}"?`

    if (!confirm(message)) return

    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = (await res.json()) as CouponMutationResponse
      if (!data.success) throw new Error(data.error ?? 'Delete failed')
      toast.success(data.deactivated ? 'Coupon deactivated (has usage history)' : 'Coupon deleted')
      fetchCoupons()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      toast.error(message)
      console.error('handleDelete error:', err)
    }
  }

  const filteredCoupons = coupons.filter(c => {
    if (filterActive === 'active') return c.is_active
    if (filterActive === 'inactive') return !c.is_active
    return true
  })

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    totalUses: coupons.reduce((sum, c) => sum + c.used_count, 0),
  }

  const isExpired = (coupon: Coupon) =>
    coupon.valid_until && new Date(coupon.valid_until) < new Date()

  const isExhausted = (coupon: Coupon) =>
    coupon.max_total_uses !== null && coupon.used_count >= coupon.max_total_uses

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Coupons</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Active Coupons</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Redemptions</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalUses}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterActive === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">COD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No coupons found
                  </td>
                </tr>
              ) : filteredCoupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <code className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">{coupon.code}</code>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${coupon.discount_type === 'percentage' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {coupon.discount_type === 'flat' ? `₹${coupon.discount_value} off` : `${coupon.discount_value}% off`}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.min_order_amount > 0 ? `₹${coupon.min_order_amount}` : '—'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-semibold">{coupon.used_count}</span>
                      <span className="text-gray-500"> / {coupon.max_total_uses ?? '∞'}</span>
                      <div className="text-xs text-gray-500">{coupon.max_uses_per_user}x per user</div>
                    </div>
                    {isExhausted(coupon) && (
                      <span className="text-xs text-red-600 font-medium">Exhausted</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${coupon.allow_on_cod ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {coupon.allow_on_cod ? 'Allowed' : 'No COD'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div>From: {new Date(coupon.valid_from).toLocaleDateString()}</div>
                    <div>
                      {coupon.valid_until
                        ? (isExpired(coupon)
                          ? <span className="text-red-600 font-medium">Expired {new Date(coupon.valid_until).toLocaleDateString()}</span>
                          : `Until: ${new Date(coupon.valid_until).toLocaleDateString()}`)
                        : <span className="text-green-600">No expiry</span>
                      }
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleActive(coupon)} className="flex items-center gap-1 text-xs">
                      {coupon.is_active
                        ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-700 font-medium">Active</span></>
                        : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-500">Inactive</span></>
                      }
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(coupon)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description (internal note)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Summer sale - 20% off"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type *</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm({ ...form, discount_type: e.target.value as 'flat' | 'percentage' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="flat">Flat (₹ off)</option>
                    <option value="percentage">Percentage (% off)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {form.discount_type === 'flat' ? 'Amount (₹) *' : 'Percentage (%) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value || ''}
                    onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                    placeholder={form.discount_type === 'flat' ? '100' : '20'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Min Order */}
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.min_order_amount || ''}
                  onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                  placeholder="0 (no minimum)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_total_uses}
                    onChange={e => setForm({ ...form, max_total_uses: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Leave blank = unlimited"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Uses Per User</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses_per_user}
                    onChange={e => setForm({ ...form, max_uses_per_user: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From *</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    placeholder="Leave blank = no expiry"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank = no expiry</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">Allow on Cash on Delivery</p>
                    <p className="text-xs text-gray-500">If disabled, coupon is for prepaid orders only</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, allow_on_cod: !form.allow_on_cod })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.allow_on_cod ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.allow_on_cod ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">Active</p>
                    <p className="text-xs text-gray-500">Inactive coupons cannot be applied at checkout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : (
                  editingCoupon ? 'Update Coupon' : 'Create Coupon'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}