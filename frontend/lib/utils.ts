// Utility helper functions

import { type ClassValue, clsx } from 'clsx';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format date to readable string
export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(d);
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Check if stock is low based on threshold
export function isLowStock(quantity: number, threshold: number = 10): boolean {
  return quantity <= threshold && quantity > 0;
}

// Check if out of stock
export function isOutOfStock(quantity: number): boolean {
  return quantity <= 0;
}

// Get stock status
export function getStockStatus(quantity: number, threshold: number = 10): {
  status: 'out-of-stock' | 'low-stock' | 'in-stock';
  label: string;
  className: string;
} {
  if (isOutOfStock(quantity)) {
    return {
      status: 'out-of-stock',
      label: 'Out of Stock',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
  }
  if (isLowStock(quantity, threshold)) {
    return {
      status: 'low-stock',
      label: 'Low Stock',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
  }
  return {
    status: 'in-stock',
    label: 'In Stock',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
}

// Validate transfer
export function validateTransfer(
  quantity: number,
  availableStock: number,
  sourceId: string,
  destinationId: string
): { valid: boolean; error?: string } {
  if (sourceId === destinationId) {
    return { valid: false, error: 'Source and destination must be different' };
  }
  if (quantity <= 0) {
    return { valid: false, error: 'Quantity must be greater than 0' };
  }
  if (quantity > availableStock) {
    return { valid: false, error: `Insufficient stock. Available: ${availableStock}` };
  }
  return { valid: true };
}

// Calculate variance for adjustments
export function calculateVariance(counted: number, system: number): {
  variance: number;
  variancePercent: number;
  isPositive: boolean;
} {
  const variance = counted - system;
  const variancePercent = system > 0 ? (variance / system) * 100 : 0;
  return {
    variance,
    variancePercent,
    isPositive: variance >= 0,
  };
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate unique ID (for client-side temporary IDs)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
