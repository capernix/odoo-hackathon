'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'

interface Product {
  id: string
  name: string
  sku: string
}

interface Warehouse {
  id: string
  name: string
  location: string
}

export default function ReceiptsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    qty: '',
    note: ''
  })

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Fetch products and warehouses
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [productsRes, warehousesRes] = await Promise.all([
      supabase.from('products').select('id, name, sku').order('name'),
      supabase.from('warehouses').select('id, name, location').order('name')
    ])
    
    if (productsRes.data) setProducts(productsRes.data)
    if (warehousesRes.data) setWarehouses(warehousesRes.data)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.product_id || !formData.warehouse_id || !formData.qty) {
      showToast('error', 'Please fill all required fields')
      return
    }

    const qty = parseInt(formData.qty)
    if (qty <= 0) {
      showToast('error', 'Quantity must be greater than 0')
      return
    }

    setShowModal(true)
  }

  const confirmReceipt = async () => {
    setLoading(true)
    setShowModal(false)

    try {
      const response = await fetch('/api/change-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'receipt',
          product_id: formData.product_id,
          warehouse_id: formData.warehouse_id,
          qty: parseInt(formData.qty),
          user_id: null, // UUID type - set to null for now
          note: formData.note || 'Stock receipt'
        })
      })

      const data = await response.json()

      if (data.ok) {
        showToast('success', `Receipt successful! New stock: ${data.final_qty}`)
        // Reset form
        setFormData({ product_id: '', warehouse_id: '', qty: '', note: '' })
      } else {
        showToast('error', data.message || 'Receipt failed')
      }
    } catch (error) {
      showToast('error', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const selectedProduct = products.find(p => p.id === formData.product_id)
  const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Receipts</h1>
        <p className="text-gray-600 mb-8">Record incoming stock to warehouse</p>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Select a warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter quantity"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Optional note (e.g., Supplier name, PO number)"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Record Receipt'}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Receipt</h3>
            <div className="space-y-2 mb-6 text-sm">
              <p><span className="font-medium">Product:</span> {selectedProduct?.name}</p>
              <p><span className="font-medium">Warehouse:</span> {selectedWarehouse?.name}</p>
              <p><span className="font-medium">Quantity:</span> +{formData.qty}</p>
              {formData.note && <p><span className="font-medium">Note:</span> {formData.note}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReceipt}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
