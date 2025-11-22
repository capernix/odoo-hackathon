'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { adjustmentAPI, stockAPI, productAPI, warehouseAPI } from '@/lib/api';
import { StockAdjustment, Product, Warehouse, StockLevel } from '@/types';
import { calculateVariance, formatDate, formatNumber } from '@/lib/utils';
import Loading from '@/components/Loading';
import Input, { Select, Textarea } from '@/components/Input';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
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
    warehouseId: '',
    countedQuantity: '',
    reason: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adjustmentsRes, productsRes, warehousesRes, stockRes] = await Promise.all([
        adjustmentAPI.getAll(),
        productAPI.getAll(),
        warehouseAPI.getAll(),
        stockAPI.getAll(),
      ]);

      if (adjustmentsRes.success && adjustmentsRes.data) {
        setAdjustments(adjustmentsRes.data);
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
      showError('Failed to load adjustment data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current system quantity for selected product and warehouse
  const systemQuantity = useMemo(() => {
    if (!formData.productId || !formData.warehouseId) return 0;
    
    const stock = stockLevels.find(
      (s) => s.productId === formData.productId && s.warehouseId === formData.warehouseId
    );
    return stock?.quantity || 0;
  }, [formData.productId, formData.warehouseId, stockLevels]);

  // Calculate variance
  const varianceInfo = useMemo(() => {
    const counted = parseFloat(formData.countedQuantity || '0');
    return calculateVariance(counted, systemQuantity);
  }, [formData.countedQuantity, systemQuantity]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.productId) {
      errors.productId = 'Please select a product';
    }
    if (!formData.warehouseId) {
      errors.warehouseId = 'Please select a warehouse';
    }
    if (!formData.countedQuantity || parseFloat(formData.countedQuantity) < 0) {
      errors.countedQuantity = 'Please enter a valid quantity';
    }
    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for adjustment';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const adjustmentData: Omit<StockAdjustment, 'id' | 'variance'> = {
        productId: formData.productId,
        warehouseId: formData.warehouseId,
        countedQuantity: parseFloat(formData.countedQuantity),
        systemQuantity: systemQuantity,
        reason: formData.reason,
        status: 'draft',
      };

      const response = await adjustmentAPI.create(adjustmentData);

      if (response.success && response.data) {
        // Auto-execute the adjustment
        const executeRes = await adjustmentAPI.execute(response.data.id!);
        
        if (executeRes.success) {
          showSuccess('Stock adjustment completed successfully');
          setIsModalOpen(false);
          resetForm();
          loadData();
        } else {
          showError(executeRes.error || 'Failed to execute adjustment');
        }
      } else {
        showError(response.error || 'Failed to create adjustment');
      }
    } catch (err) {
      showError('An error occurred while creating adjustment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      warehouseId: '',
      countedQuantity: '',
      reason: '',
    });
    setFormErrors({});
  };

  // Statistics
  const stats = useMemo(() => {
    const totalAdjustments = adjustments.length;
    const positiveAdjustments = adjustments.filter((a) => a.variance > 0).length;
    const negativeAdjustments = adjustments.filter((a) => a.variance < 0).length;
    const totalVariance = adjustments.reduce((sum, a) => sum + Math.abs(a.variance), 0);

    return { totalAdjustments, positiveAdjustments, negativeAdjustments, totalVariance };
  }, [adjustments]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading fullScreen text="Loading adjustments..." />
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
              Stock Adjustments
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Reconcile physical counts with system records
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Adjustment
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Adjustments"
            value={stats.totalAdjustments}
            icon={<CheckCircle className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Positive Variance"
            value={stats.positiveAdjustments}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Negative Variance"
            value={stats.negativeAdjustments}
            icon={<TrendingDown className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="Total Variance"
            value={formatNumber(stats.totalVariance)}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Adjustments Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    System Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Counted Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No adjustments found. Create your first adjustment!
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => {
                    const product = products.find((p) => p.id === adjustment.productId);
                    const warehouse = warehouses.find((w) => w.id === adjustment.warehouseId);
                    const variance = calculateVariance(adjustment.countedQuantity, adjustment.systemQuantity);

                    return (
                      <tr
                        key={adjustment.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {product?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {warehouse?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {formatNumber(adjustment.systemQuantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatNumber(adjustment.countedQuantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {variance.isPositive ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={variance.isPositive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {variance.isPositive ? '+' : ''}{formatNumber(variance.variance)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {adjustment.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {formatDate(adjustment.createdAt)}
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

      {/* Create Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create Stock Adjustment"
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

          <Select
            label="Warehouse"
            value={formData.warehouseId}
            onChange={(e) => handleInputChange('warehouseId', e.target.value)}
            error={formErrors.warehouseId}
            options={[
              { value: '', label: 'Select a warehouse' },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ]}
            required
          />

          {/* System Quantity Display */}
          {formData.productId && formData.warehouseId && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Current System Quantity:
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {formatNumber(systemQuantity)}
                </span>
              </div>
            </div>
          )}

          <Input
            type="number"
            label="Counted Quantity"
            value={formData.countedQuantity}
            onChange={(e) => handleInputChange('countedQuantity', e.target.value)}
            error={formErrors.countedQuantity}
            helperText="Enter the physical count"
            min="0"
            step="1"
            required
          />

          {/* Variance Display */}
          {formData.countedQuantity && formData.productId && formData.warehouseId && (
            <div className={`p-4 rounded-lg ${
              varianceInfo.isPositive 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {varianceInfo.isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">Variance:</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    varianceInfo.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {varianceInfo.isPositive ? '+' : ''}{formatNumber(varianceInfo.variance)}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                    ({varianceInfo.variancePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          <Textarea
            label="Reason for Adjustment"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            error={formErrors.reason}
            rows={3}
            placeholder="e.g., Physical inventory count, damaged items, theft..."
            required
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
              Create & Execute Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </DashboardLayout>
  );
}

// Statistics Card Component
interface StatCardProps {
  title: string;
  value: number | string;
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
