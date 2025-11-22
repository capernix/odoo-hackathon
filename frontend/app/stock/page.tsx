'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Package, Warehouse as WarehouseIcon, RefreshCw } from 'lucide-react';
import { stockAPI, productAPI, warehouseAPI } from '@/lib/api';
import { StockLevel, Product, Warehouse } from '@/types';
import { getStockStatus, formatNumber, debounce } from '@/lib/utils';
import Loading, { TableSkeleton } from '@/components/Loading';
import Input, { Select } from '@/components/Input';
import Button from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function StockPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stockRes, productsRes, warehousesRes] = await Promise.all([
        stockAPI.getAll(),
        productAPI.getAll(),
        warehouseAPI.getAll(),
      ]);

      if (stockRes.success && stockRes.data) {
        setStockLevels(stockRes.data);
      }
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (warehousesRes.success && warehousesRes.data) {
        setWarehouses(warehousesRes.data);
      }
    } catch (err) {
      showError('Failed to load stock data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    showSuccess('Stock data refreshed');
  };

  // Enhanced stock levels with product and warehouse info
  const enrichedStockLevels = useMemo(() => {
    return stockLevels.map((stock) => {
      const product = products.find((p) => p.id === stock.productId);
      const warehouse = warehouses.find((w) => w.id === stock.warehouseId);
      
      return {
        ...stock,
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku || 'N/A',
        warehouseName: warehouse?.name || 'Unknown Warehouse',
        reorderThreshold: product?.reorderThreshold || 10,
      };
    });
  }, [stockLevels, products, warehouses]);

  // Filter stock levels
  const filteredStockLevels = useMemo(() => {
    let filtered = enrichedStockLevels;

    // Filter by warehouse
    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter((stock) => stock.warehouseId === selectedWarehouse);
    }

    // Filter by product
    if (selectedProduct !== 'all') {
      filtered = filtered.filter((stock) => stock.productId === selectedProduct);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (stock) =>
          stock.productName.toLowerCase().includes(term) ||
          stock.productSku.toLowerCase().includes(term) ||
          stock.warehouseName.toLowerCase().includes(term)
      );
    }

    // Filter low stock only
    if (lowStockOnly) {
      filtered = filtered.filter((stock) => stock.quantity <= stock.reorderThreshold);
    }

    return filtered;
  }, [enrichedStockLevels, selectedWarehouse, selectedProduct, searchTerm, lowStockOnly]);

  // Statistics
  const stats = useMemo(() => {
    const totalProducts = new Set(stockLevels.map((s) => s.productId)).size;
    const lowStockItems = enrichedStockLevels.filter(
      (s) => s.quantity > 0 && s.quantity <= s.reorderThreshold
    ).length;
    const outOfStockItems = enrichedStockLevels.filter((s) => s.quantity === 0).length;
    const totalValue = enrichedStockLevels.reduce((sum, s) => sum + s.quantity, 0);

    return { totalProducts, lowStockItems, outOfStockItems, totalValue };
  }, [stockLevels, enrichedStockLevels]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading fullScreen text="Loading stock data..." />
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
              Stock Overview
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Real-time inventory across all warehouses
            </p>
          </div>
          <Button
            variant="outline"
            onClick={refreshData}
            isLoading={isRefreshing}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<Package className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockItems}
            icon={<Package className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="Total Units"
            value={formatNumber(stats.totalValue)}
            icon={<WarehouseIcon className="w-6 h-6" />}
            color="green"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Filters
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-9 w-4 h-4 text-zinc-400" />
              <Input
                label="Search"
                placeholder="Search products, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              label="Warehouse"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              options={[
                { value: 'all', label: 'All Warehouses' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />

            <Select
              label="Product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              options={[
                { value: 'all', label: 'All Products' },
                ...products.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Low Stock Only
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredStockLevels.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No stock data found
                    </td>
                  </tr>
                ) : (
                  filteredStockLevels.map((stock) => {
                    const status = getStockStatus(stock.quantity, stock.reorderThreshold);
                    return (
                      <tr
                        key={`${stock.productId}-${stock.warehouseId}`}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {stock.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {stock.productSku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          {stock.warehouseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatNumber(stock.quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Showing {filteredStockLevels.length} of {enrichedStockLevels.length} stock entries
        </div>
      </div>
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
