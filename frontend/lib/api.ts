// API Utility Functions for StockMaster

import { 
  Product, 
  Warehouse, 
  StockLevel, 
  InternalTransfer, 
  StockAdjustment,
  StockMovement,
  ApiResponse 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8069';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// Product APIs
export const productAPI = {
  getAll: () => fetchAPI<Product[]>('/api/products'),
  getById: (id: string) => fetchAPI<Product>(`/api/products/${id}`),
  create: (product: Omit<Product, 'id'>) => 
    fetchAPI<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  update: (id: string, product: Partial<Product>) => 
    fetchAPI<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  delete: (id: string) => 
    fetchAPI<void>(`/api/products/${id}`, { method: 'DELETE' }),
};

// Warehouse APIs
export const warehouseAPI = {
  getAll: () => fetchAPI<Warehouse[]>('/api/warehouses'),
  getById: (id: string) => fetchAPI<Warehouse>(`/api/warehouses/${id}`),
  create: (warehouse: Omit<Warehouse, 'id'>) => 
    fetchAPI<Warehouse>('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(warehouse),
    }),
  update: (id: string, warehouse: Partial<Warehouse>) => 
    fetchAPI<Warehouse>(`/api/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(warehouse),
    }),
  delete: (id: string) => 
    fetchAPI<void>(`/api/warehouses/${id}`, { method: 'DELETE' }),
};

// Stock Level APIs
export const stockAPI = {
  getAll: () => fetchAPI<StockLevel[]>('/api/stock'),
  getByProduct: (productId: string) => 
    fetchAPI<StockLevel[]>(`/api/stock/product/${productId}`),
  getByWarehouse: (warehouseId: string) => 
    fetchAPI<StockLevel[]>(`/api/stock/warehouse/${warehouseId}`),
  getByProductAndWarehouse: (productId: string, warehouseId: string) => 
    fetchAPI<StockLevel>(`/api/stock/${productId}/${warehouseId}`),
  changeStock: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reason?: string;
  }) => 
    fetchAPI<StockLevel>('/api/change-stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Internal Transfer APIs
export const transferAPI = {
  getAll: () => fetchAPI<InternalTransfer[]>('/api/transfers'),
  getById: (id: string) => fetchAPI<InternalTransfer>(`/api/transfers/${id}`),
  create: (transfer: Omit<InternalTransfer, 'id'>) => 
    fetchAPI<InternalTransfer>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    }),
  execute: (id: string) => 
    fetchAPI<InternalTransfer>(`/api/transfers/${id}/execute`, {
      method: 'POST',
    }),
  cancel: (id: string) => 
    fetchAPI<InternalTransfer>(`/api/transfers/${id}/cancel`, {
      method: 'POST',
    }),
};

// Stock Adjustment APIs
export const adjustmentAPI = {
  getAll: () => fetchAPI<StockAdjustment[]>('/api/adjustments'),
  getById: (id: string) => fetchAPI<StockAdjustment>(`/api/adjustments/${id}`),
  create: (adjustment: Omit<StockAdjustment, 'id' | 'variance'>) => 
    fetchAPI<StockAdjustment>('/api/adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    }),
  execute: (id: string) => 
    fetchAPI<StockAdjustment>(`/api/adjustments/${id}/execute`, {
      method: 'POST',
    }),
};

// Movement History APIs
export const movementAPI = {
  getAll: () => fetchAPI<StockMovement[]>('/api/movements'),
  getByProduct: (productId: string) => 
    fetchAPI<StockMovement[]>(`/api/movements/product/${productId}`),
  getByWarehouse: (warehouseId: string) => 
    fetchAPI<StockMovement[]>(`/api/movements/warehouse/${warehouseId}`),
  undoLast: () => 
    fetchAPI<void>('/api/undo-last', { method: 'POST' }),
};
