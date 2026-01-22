// app/profile/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getOrders, getAddresses, createAddress, updateAddress, deleteAddress, type Order, type Address } from "@/lib/supabase-orders"
import Link from "next/link"
import { User, MapPin, Package, Plus, Edit, Trash2, Check } from "lucide-react"

export default function ProfilePage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">("profile")
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    loadData()
  }, [isLoggedIn, user])

  const loadData = async () => {
    try {
      const [ordersData, addressesData] = await Promise.all([
        getOrders(user!.id),
        getAddresses(user!.id),
      ])
      setOrders(ordersData)
      setAddresses(addressesData)
    } catch (error) {
      console.error("Failed to load profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(editingAddress.id!, addressForm)
      } else {
        // Create new address
        await createAddress({
          ...addressForm,
          user_id: user!.id,
          email: ""
        })
      }
      
      // Reload addresses
      const addressesData = await getAddresses(user!.id)
      setAddresses(addressesData)
      
      // Reset form
      setShowAddressForm(false)
      setEditingAddress(null)
      setAddressForm({
        first_name: "",
        last_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false,
      })
    } catch (error) {
      console.error("Failed to save address:", error)
      alert("Failed to save address")
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return

    try {
      await deleteAddress(id)
      const addressesData = await getAddresses(user!.id)
      setAddresses(addressesData)
    } catch (error) {
      console.error("Failed to delete address:", error)
      alert("Failed to delete address")
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (!isLoggedIn) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-lg p-4 space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "profile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "addresses" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <MapPin className="w-5 h-5" />
                Addresses
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Package className="w-5 h-5" />
                Orders
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="border border-border rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={user?.name}
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    To update your profile information, please contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Saved Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add Address
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <input
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        value={addressForm.first_name}
                        onChange={handleAddressFormChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        value={addressForm.last_name}
                        onChange={handleAddressFormChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={addressForm.phone}
                        onChange={handleAddressFormChange}
                        className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="address_line1"
                        placeholder="Address Line 1"
                        value={addressForm.address_line1}
                        onChange={handleAddressFormChange}
                        className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="address_line2"
                        placeholder="Address Line 2 (Optional)"
                        value={addressForm.address_line2}
                        onChange={handleAddressFormChange}
                        className="md:col-span-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={handleAddressFormChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <input
                        type="text"
                        name="postal_code"
                        placeholder="Postal Code"
                        value={addressForm.postal_code}
                        onChange={handleAddressFormChange}
                        className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                      <label className="md:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_default"
                          checked={addressForm.is_default}
                          onChange={handleAddressFormChange}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Set as default address</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleSaveAddress}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                      >
                        {editingAddress ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddressForm(false)
                          setEditingAddress(null)
                          setAddressForm({
                            first_name: "",
                            last_name: "",
                            phone: "",
                            address_line1: "",
                            address_line2: "",
                            city: "",
                            state: "",
                            postal_code: "",
                            country: "India",
                            is_default: false,
                          })
                        }}
                        className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-lg">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground mb-2">No saved addresses</p>
                    <p className="text-sm text-muted-foreground">Add an address to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border border-border rounded-lg p-4 flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">
                              {address.first_name} {address.last_name}
                            </p>
                            {address.is_default && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id!)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Order History</h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-lg">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground mb-2">No orders yet</p>
                    <p className="text-sm text-muted-foreground mb-6">Start shopping to see your orders here</p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border border-border rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg mb-1">Order #{order.order_number}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at!).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                            {order.order_status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {order.items.length} item{order.items.length > 1 ? "s" : ""}
                            </p>
                            <p className="font-bold text-lg text-primary">₹{order.total.toFixed(2)}</p>
                          </div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}

                    {orders.length > 5 && (
                      <Link
                        href="/orders"
                        className="block text-center py-3 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
                      >
                        View All Orders ({orders.length})
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}