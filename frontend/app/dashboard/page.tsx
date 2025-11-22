'use client';

import { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Warehouse as WarehouseIcon,
  ArrowRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { stockAPI, productAPI, warehouseAPI, transferAPI, adjustmentAPI } from '@/lib/api';
import { StockLevel, Product, Warehouse, InternalTransfer, StockAdjustment } from '@/types';
import { getStockStatus, formatNumber } from '@/lib/utils';
import Loading from '@/components/Loading';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stockRes, productsRes, warehousesRes, transfersRes, adjustmentsRes] = await Promise.all([
        stockAPI.getAll(),
        productAPI.getAll(),
        warehouseAPI.getAll(),
        transferAPI.getAll(),
        adjustmentAPI.getAll(),
      ]);

      if (stockRes.success && stockRes.data) setStockLevels(stockRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
      if (warehousesRes.success && warehousesRes.data) setWarehouses(warehousesRes.data);
      if (transfersRes.success && transfersRes.data) setTransfers(transfersRes.data);
      if (adjustmentsRes.success && adjustmentsRes.data) setAdjustments(adjustmentsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const enrichedStockLevels = stockLevels.map((stock) => {
    const product = products.find((p) => p.id === stock.productId);
    return {
      ...stock,
      reorderThreshold: product?.reorderThreshold || 10,
    };
  });

  const totalProducts = new Set(stockLevels.map(s => s.productId)).size;
  const lowStockCount = enrichedStockLevels.filter(s => 
    s.quantity > 0 && s.quantity <= s.reorderThreshold
  ).length;
  const outOfStockCount = enrichedStockLevels.filter(s => s.quantity === 0).length;
  const pendingTransfers = transfers.filter(t => ['draft', 'waiting', 'ready'].includes(t.status)).length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading fullScreen text="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Overview of your inventory operations
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Products"
            value={totalProducts}
            icon={<Package className="w-6 h-6" />}
            color="blue"
            linkText="View All"
            linkHref="/products"
          />
          <KPICard
            title="Low Stock Items"
            value={lowStockCount}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
            linkText="View Details"
            linkHref="/stock"
          />
          <KPICard
            title="Out of Stock"
            value={outOfStockCount}
            icon={<Package className="w-6 h-6" />}
            color="red"
            linkText="View Details"
            linkHref="/stock"
          />
          <KPICard
            title="Pending Transfers"
            value={pendingTransfers}
            icon={<Clock className="w-6 h-6" />}
            color="purple"
            linkText="View Transfers"
            linkHref="/transfers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transfers */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Transfers
              </h2>
              <Link 
                href="/transfers"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {transfers.slice(0, 5).map((transfer) => {
                const product = products.find(p => p.id === transfer.productId);
                const sourceWh = warehouses.find(w => w.id === transfer.sourceWarehouseId);
                const destWh = warehouses.find(w => w.id === transfer.destinationWarehouseId);
                
                return (
                  <div key={transfer.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {product?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {sourceWh?.name} → {destWh?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {transfer.quantity}
                      </p>
                      <StatusBadge status={transfer.status} />
                    </div>
                  </div>
                );
              })}
              {transfers.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No transfers yet
                </p>
              )}
            </div>
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Recent Adjustments
              </h2>
              <Link 
                href="/adjustments"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {adjustments.slice(0, 5).map((adjustment) => {
                const product = products.find(p => p.id === adjustment.productId);
                const warehouse = warehouses.find(w => w.id === adjustment.warehouseId);
                
                return (
                  <div key={adjustment.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {product?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {warehouse?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        adjustment.variance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {adjustment.variance >= 0 ? '+' : ''}{adjustment.variance}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {adjustment.countedQuantity} counted
                      </p>
                    </div>
                  </div>
                );
              })}
              {adjustments.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No adjustments yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="New Transfer"
              description="Move stock between warehouses"
              href="/transfers"
              icon={<TrendingUp className="w-8 h-8" />}
            />
            <QuickActionCard
              title="Stock Adjustment"
              description="Reconcile physical counts"
              href="/adjustments"
              icon={<Package className="w-8 h-8" />}
            />
            <QuickActionCard
              title="View Stock"
              description="Check current inventory levels"
              href="/stock"
              icon={<WarehouseIcon className="w-8 h-8" />}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'red' | 'purple';
  linkText: string;
  linkHref: string;
}

function KPICard({ title, value, icon, color, linkText, linkHref }: KPICardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <Link href={linkHref} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {linkText}
        </Link>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
        {value}
      </p>
    </div>
  );
}

// Quick Action Card
interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickActionCard({ title, description, href, icon }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
    >
      <div className="text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </Link>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
    waiting: { label: 'Waiting', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' },
    ready: { label: 'Ready', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
    done: { label: 'Done', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
