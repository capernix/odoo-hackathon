'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/components/DashboardLayout'

interface Warehouse {
  id: string
  name: string
  location: string
  created_at: string
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  })

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      showToast('error', 'Failed to fetch warehouses')
    } else {
      setWarehouses(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.location) {
      showToast('error', 'Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      if (editingId) {
        // Update existing warehouse
        const { error } = await supabase
          .from('warehouses')
          .update({
            name: formData.name,
            location: formData.location
          })
          .eq('id', editingId)

        if (error) {
          showToast('error', error.message)
        } else {
          showToast('success', 'Warehouse updated successfully')
          resetForm()
          fetchWarehouses()
        }
      } else {
        // Create new warehouse
        const { error } = await supabase
          .from('warehouses')
          .insert([{
            name: formData.name,
            location: formData.location
          }])

        if (error) {
          showToast('error', error.message)
        } else {
          showToast('success', 'Warehouse added successfully')
          resetForm()
          fetchWarehouses()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id)
    setFormData({
      name: warehouse.name,
      location: warehouse.location
    })
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    setLoading(true)
    
    // Check if warehouse is used in stock or ledger
    const [stockCheck, ledgerCheck] = await Promise.all([
      supabase.from('stock').select('id').eq('warehouse_id', id).limit(1),
      supabase.from('ledger').select('id').eq('warehouse_id', id).limit(1)
    ])

    if (stockCheck.data && stockCheck.data.length > 0) {
      showToast('error', 'Cannot delete: Warehouse has stock records')
      setLoading(false)
      return
    }

    if (ledgerCheck.data && ledgerCheck.data.length > 0) {
      showToast('error', 'Cannot delete: Warehouse has transaction history')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id)

    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', 'Warehouse deleted successfully')
      fetchWarehouses()
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: '', location: '' })
    setEditingId(null)
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
            <p className="text-gray-600 mt-1">Manage your warehouse locations</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Warehouses: <span className="font-bold text-gray-900">{warehouses.length}</span>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No warehouses yet. Add your first warehouse below.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-lg">🏭</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {warehouse.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          {warehouse.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(warehouse)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse.id, warehouse.name)}
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
            {editingId ? 'Edit Warehouse' : 'Add New Warehouse'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warehouse Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Main Warehouse"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Mumbai, Building A"
                  required
                />
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
                {loading ? 'Saving...' : editingId ? 'Update Warehouse' : 'Add Warehouse'}
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
