'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Plus, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { transferAPI, stockAPI, productAPI, warehouseAPI } from '@/lib/api';
import { InternalTransfer, Product, Warehouse, StockLevel } from '@/types';
import { validateTransfer, formatDate } from '@/lib/utils';
import Loading from '@/components/Loading';
import Input, { Select, Textarea } from '@/components/Input';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    quantity: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transfersRes, productsRes, warehousesRes, stockRes] = await Promise.all([
        transferAPI.getAll(),
        productAPI.getAll(),
        warehouseAPI.getAll(),
        stockAPI.getAll(),
      ]);

      if (transfersRes.success && transfersRes.data) {
        setTransfers(transfersRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (warehousesRes.success && warehousesRes.data) {
        setWarehouses(warehousesRes.data);
      }
      if (stockRes.success && stockRes.data) {
        setStockLevels(stockRes.data);
      }
    } catch (err) {
      showError('Failed to load transfer data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get available stock for selected product and warehouse
  const availableStock = useMemo(() => {
    if (!formData.productId || !formData.sourceWarehouseId) return 0;
    
    const stock = stockLevels.find(
      (s) => s.productId === formData.productId && s.warehouseId === formData.sourceWarehouseId
    );
    return stock?.quantity || 0;
  }, [formData.productId, formData.sourceWarehouseId, stockLevels]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.productId) {
      errors.productId = 'Please select a product';
    }
    if (!formData.sourceWarehouseId) {
      errors.sourceWarehouseId = 'Please select source warehouse';
    }
    if (!formData.destinationWarehouseId) {
      errors.destinationWarehouseId = 'Please select destination warehouse';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = 'Please enter a valid quantity';
    }

    // Validate transfer
    const validation = validateTransfer(
      parseFloat(formData.quantity || '0'),
      availableStock,
      formData.sourceWarehouseId,
      formData.destinationWarehouseId
    );

    if (!validation.valid && validation.error) {
      errors.quantity = validation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const transferData: Omit<InternalTransfer, 'id'> = {
        productId: formData.productId,
        sourceWarehouseId: formData.sourceWarehouseId,
        destinationWarehouseId: formData.destinationWarehouseId,
        quantity: parseFloat(formData.quantity),
        status: 'draft',
        notes: formData.notes || undefined,
      };

      const response = await transferAPI.create(transferData);

      if (response.success && response.data) {
        // Auto-execute the transfer
        const executeRes = await transferAPI.execute(response.data.id!);
        
        if (executeRes.success) {
          showSuccess('Transfer completed successfully');
          setIsModalOpen(false);
          resetForm();
          loadData();
        } else {
          showError(executeRes.error || 'Failed to execute transfer');
        }
      } else {
        showError(response.error || 'Failed to create transfer');
      }
    } catch (err) {
      showError('An error occurred while creating transfer');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      quantity: '',
      notes: '',
    });
    setFormErrors({});
  };

  const handleCancelTransfer = async (id: string) => {
    try {
      const response = await transferAPI.cancel(id);
      if (response.success) {
        showSuccess('Transfer cancelled');
        loadData();
      } else {
        showError(response.error || 'Failed to cancel transfer');
      }
    } catch (err) {
      showError('An error occurred');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading fullScreen text="Loading transfers..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Internal Transfers
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Move stock between warehouses
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Transfer
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Transfers"
            value={transfers.length}
            icon={<Truck className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={transfers.filter((t) => t.status === 'done').length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Pending"
            value={transfers.filter((t) => ['draft', 'waiting', 'ready'].includes(t.status)).length}
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Cancelled"
            value={transfers.filter((t) => t.status === 'cancelled').length}
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Transfers Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    From → To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No transfers found. Create your first transfer!
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => {
                    const product = products.find((p) => p.id === transfer.productId);
                    const sourceWarehouse = warehouses.find((w) => w.id === transfer.sourceWarehouseId);
                    const destWarehouse = warehouses.find((w) => w.id === transfer.destinationWarehouseId);

                    return (
                      <tr
                        key={transfer.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {product?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span>{sourceWarehouse?.name || 'Unknown'}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{destWarehouse?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {transfer.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={transfer.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {formatDate(transfer.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transfer.status === 'draft' && (
                            <button
                              onClick={() => handleCancelTransfer(transfer.id!)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create Internal Transfer"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Product"
            value={formData.productId}
            onChange={(e) => handleInputChange('productId', e.target.value)}
            error={formErrors.productId}
            options={[
              { value: '', label: 'Select a product' },
              ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="From Warehouse"
              value={formData.sourceWarehouseId}
              onChange={(e) => handleInputChange('sourceWarehouseId', e.target.value)}
              error={formErrors.sourceWarehouseId}
              options={[
                { value: '', label: 'Select source' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              required
            />

            <Select
              label="To Warehouse"
              value={formData.destinationWarehouseId}
              onChange={(e) => handleInputChange('destinationWarehouseId', e.target.value)}
              error={formErrors.destinationWarehouseId}
              options={[
                { value: '', label: 'Select destination' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              required
            />
          </div>

          <Input
            type="number"
            label="Quantity"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            error={formErrors.quantity}
            helperText={`Available stock: ${availableStock}`}
            min="1"
            step="1"
            required
          />

          <Textarea
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            placeholder="Add any additional notes..."
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create & Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </DashboardLayout>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
    waiting: { label: 'Waiting', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
    ready: { label: 'Ready', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
    done: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

// Statistics Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'red' | 'green';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
