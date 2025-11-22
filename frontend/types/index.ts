// Core Types for StockMaster Inventory System

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitOfMeasure: string;
  reorderThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  type?: 'main' | 'production' | 'storage' | 'transit';
  createdAt?: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  productName?: string;
  productSku?: string;
  warehouseName?: string;
  lastUpdated?: string;
}

export interface InternalTransfer {
  id?: string;
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';
  notes?: string;
  createdAt?: string;
  completedAt?: string;
  createdBy?: string;
}

export interface StockAdjustment {
  id?: string;
  productId: string;
  warehouseId: string;
  countedQuantity: number;
  systemQuantity: number;
  variance: number;
  reason: string;
  status: 'draft' | 'done';
  createdAt?: string;
  completedAt?: string;
  createdBy?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId?: string;
  warehouseName?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  type: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'undo';
  quantity: number;
  quantityChange: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FilterOptions {
  warehouseId?: string;
  productId?: string;
  category?: string;
  searchTerm?: string;
  lowStockOnly?: boolean;
}
