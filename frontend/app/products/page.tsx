'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'

interface Product {
  id: string
  name: string
  sku: string
  unit: string
  reorder_threshold: number
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'pcs',
    reorder_threshold: ''
  })

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      showToast('error', 'Failed to fetch products')
    } else {
      setProducts(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.sku || !formData.reorder_threshold) {
      showToast('error', 'Please fill all required fields')
      return
    }

    const threshold = parseInt(formData.reorder_threshold)
    if (threshold < 0) {
      showToast('error', 'Reorder threshold must be positive')
      return
    }

    setLoading(true)

    try {
      if (editingId) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            sku: formData.sku,
            unit: formData.unit,
            reorder_threshold: threshold
          })
          .eq('id', editingId)

        if (error) {
          if (error.code === '23505') { // Unique violation
            showToast('error', 'SKU already exists')
          } else {
            showToast('error', error.message)
          }
        } else {
          showToast('success', 'Product updated successfully')
          resetForm()
          fetchProducts()
        }
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            sku: formData.sku,
            unit: formData.unit,
            reorder_threshold: threshold
          }])

        if (error) {
          if (error.code === '23505') {
            showToast('error', 'SKU already exists')
          } else {
            showToast('error', error.message)
          }
        } else {
          showToast('success', 'Product added successfully')
          resetForm()
          fetchProducts()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      reorder_threshold: product.reorder_threshold.toString()
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    setLoading(true)
    
    // Check if product is used in stock or ledger
    const [stockCheck, ledgerCheck] = await Promise.all([
      supabase.from('stock').select('id').eq('product_id', id).limit(1),
      supabase.from('ledger').select('id').eq('product_id', id).limit(1)
    ])

    if (stockCheck.data && stockCheck.data.length > 0) {
      showToast('error', 'Cannot delete: Product has stock records')
      setLoading(false)
      return
    }

    if (ledgerCheck.data && ledgerCheck.data.length > 0) {
      showToast('error', 'Cannot delete: Product has transaction history')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', 'Product deleted successfully')
      fetchProducts()
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: '', sku: '', unit: 'pcs', reorder_threshold: '' })
    setEditingId(null)
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Products: <span className="font-bold text-gray-900">{products.length}</span>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Threshold
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No products yet. Add your first product below.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.reorder_threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Steel Bolts M8"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono"
                  placeholder="e.g., STL-BLT-M8-001"
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="m">Meters (m)</option>
                  <option value="l">Liters (l)</option>
                  <option value="box">Box</option>
                  <option value="carton">Carton</option>
                </select>
              </div>

              {/* Reorder Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Threshold <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_threshold}
                  onChange={(e) => setFormData({ ...formData, reorder_threshold: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 50"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
