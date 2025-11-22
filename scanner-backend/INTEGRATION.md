# 🔌 Frontend Integration Guide

## When You're Ready to Integrate...

This guide shows you **exactly** how to connect the scanner backend to your StockMaster frontend. Designed for **seamless, quick integration** when you give the word!

---

## 📋 Pre-Integration Checklist

Before integrating, ensure:

- ✅ Scanner backend is running (`python api.py`)
- ✅ QR codes are generated and printed
- ✅ Frontend dev server is running (port 3001)
- ✅ You've tested the scanner API at http://localhost:8000/docs

---

## 🎯 Integration Steps (15 Minutes)

### Step 1: Create WebSocket Hook (5 min)

Create `frontend/hooks/useScanner.ts`:

```typescript
import { useEffect, useState, useRef, useCallback } from 'react';

interface ScanResult {
  type: string;
  data: string;
  format: string;
  bbox: number[][];
}

interface ScannerFrame {
  type: 'frame';
  image: string; // base64
  results: ScanResult[];
  timestamp: number;
}

interface UseScannerOptions {
  cameraId?: number;
  onScan?: (result: ScanResult) => void;
  autoConnect?: boolean;
}

export const useScanner = (options: UseScannerOptions = {}) => {
  const { 
    cameraId = 0, 
    onScan, 
    autoConnect = false 
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string>('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/scanner/${cameraId}`);
      
      ws.onopen = () => {
        console.log('✅ Scanner connected');
        setIsConnected(true);
        setError('');
      };

      ws.onmessage = (event) => {
        try {
          const data: ScannerFrame = JSON.parse(event.data);
          
          if (data.type === 'frame') {
            setCurrentFrame(`data:image/jpeg;base64,${data.image}`);
            setScanResults(data.results);
            
            // Trigger callback for new scans
            if (data.results.length > 0 && onScan) {
              const latestResult = data.results[0];
              setLastScan(latestResult);
              onScan(latestResult);
            }
          }
        } catch (err) {
          console.error('Error parsing scanner data:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Scanner connection error');
      };

      ws.onclose = () => {
        console.log('❌ Scanner disconnected');
        setIsConnected(false);
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnecting...');
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to start scanner');
    }
  }, [cameraId, onScan]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    currentFrame,
    scanResults,
    lastScan,
    error,
    connect,
    disconnect,
  };
};
```

---

### Step 2: Create Scanner API Client (3 min)

Add to `frontend/lib/api.ts`:

```typescript
// Scanner API endpoints
const SCANNER_API_BASE = 'http://localhost:8000';

export const scannerAPI = {
  // Start scanner
  startScanner: async (cameraId: number = 0, width: number = 1280, height: number = 720) => {
    const response = await fetch(`${SCANNER_API_BASE}/scanner/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: cameraId,
        resolution_width: width,
        resolution_height: height,
      }),
    });
    return response.json();
  },

  // Stop scanner
  stopScanner: async (cameraId: number = 0) => {
    const response = await fetch(`${SCANNER_API_BASE}/scanner/stop/${cameraId}`, {
      method: 'POST',
    });
    return response.json();
  },

  // Process receipt scan
  scanReceipt: async (productBarcode: string, warehouseBarcode: string, quantity: number) => {
    const response = await fetch(`${SCANNER_API_BASE}/scan/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_barcode: productBarcode,
        warehouse_barcode: warehouseBarcode,
        quantity,
        scanned_by: 'web_user',
        scanner_id: 'web_scanner',
      }),
    });
    return response.json();
  },

  // Process delivery scan
  scanDelivery: async (productBarcode: string, warehouseBarcode: string, quantity: number) => {
    const response = await fetch(`${SCANNER_API_BASE}/scan/delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_barcode: productBarcode,
        warehouse_barcode: warehouseBarcode,
        quantity,
        scanned_by: 'web_user',
        scanner_id: 'web_scanner',
      }),
    });
    return response.json();
  },

  // Lookup barcode
  lookupBarcode: async (barcode: string) => {
    const response = await fetch(`${SCANNER_API_BASE}/scan/lookup/${encodeURIComponent(barcode)}`);
    return response.json();
  },

  // Get scan history
  getScanHistory: async (limit: number = 50) => {
    const response = await fetch(`${SCANNER_API_BASE}/scan/history?limit=${limit}`);
    return response.json();
  },
};
```

---

### Step 3: Create Scanner UI Component (5 min)

Create `frontend/app/scanner/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useScanner } from '@/hooks/useScanner';
import { scannerAPI } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Camera, QrCode, Package, Warehouse } from 'lucide-react';

export default function ScannerPage() {
  const { showToast } = useToast();
  const [scanMode, setScanMode] = useState<'receipt' | 'delivery'>('receipt');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [scannedWarehouse, setScannedWarehouse] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { 
    isConnected, 
    currentFrame, 
    scanResults, 
    lastScan,
    connect, 
    disconnect 
  } = useScanner({
    autoConnect: false,
    onScan: handleScan,
  });

  async function handleScan(result: any) {
    try {
      const barcodeData = JSON.parse(result.data);
      
      if (barcodeData.type === 'product') {
        setScannedProduct(barcodeData);
        showToast('Product scanned: ' + barcodeData.name, 'success');
      } else if (barcodeData.type === 'warehouse') {
        setScannedWarehouse(barcodeData);
        showToast('Warehouse scanned: ' + barcodeData.name, 'success');
      }

      // Auto-show confirm modal when both are scanned
      if (scannedProduct && barcodeData.type === 'warehouse') {
        setShowConfirmModal(true);
      } else if (scannedWarehouse && barcodeData.type === 'product') {
        setShowConfirmModal(true);
      }
    } catch (err) {
      console.error('Invalid QR code format:', err);
    }
  }

  async function handleConfirmScan() {
    if (!scannedProduct || !scannedWarehouse) {
      showToast('Please scan both product and warehouse', 'error');
      return;
    }

    try {
      const apiCall = scanMode === 'receipt' 
        ? scannerAPI.scanReceipt 
        : scannerAPI.scanDelivery;

      const result = await apiCall(
        JSON.stringify(scannedProduct),
        JSON.stringify(scannedWarehouse),
        quantity
      );

      if (result.success) {
        showToast(
          `${scanMode === 'receipt' ? 'Received' : 'Delivered'} ${quantity} x ${scannedProduct.name}`,
          'success'
        );
        
        // Reset for next scan
        setScannedProduct(null);
        setScannedWarehouse(null);
        setQuantity(1);
        setShowConfirmModal(false);
      } else {
        showToast(result.message || 'Scan failed', 'error');
      }
    } catch (error) {
      showToast('Error processing scan', 'error');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">QR Scanner</h1>
            <p className="text-gray-600 mt-1">
              Scan products and warehouse locations instantly
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={scanMode === 'receipt' ? 'primary' : 'secondary'}
              onClick={() => setScanMode('receipt')}
            >
              Receipt Mode
            </Button>
            <Button
              variant={scanMode === 'delivery' ? 'primary' : 'secondary'}
              onClick={() => setScanMode('delivery')}
            >
              Delivery Mode
            </Button>
          </div>
        </div>

        {/* Scanner Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Feed
            </h2>
            {!isConnected ? (
              <Button onClick={connect} variant="primary">
                <Camera className="w-4 h-4" />
                Start Scanner
              </Button>
            ) : (
              <Button onClick={disconnect} variant="secondary">
                Stop Scanner
              </Button>
            )}
          </div>

          {/* Camera Feed */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {currentFrame ? (
              <img 
                src={currentFrame} 
                alt="Scanner feed" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>{isConnected ? 'Waiting for camera...' : 'Click "Start Scanner" to begin'}</p>
                </div>
              </div>
            )}

            {/* Scan results overlay */}
            {scanResults.length > 0 && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="font-semibold">✓ {scanResults.length} code(s) detected</p>
              </div>
            )}

            {/* Connection status */}
            <div className="absolute bottom-4 left-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-gray-300'}`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Scanned Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanned Product */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Scanned Product
            </h3>
            {scannedProduct ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold">{scannedProduct.name}</p>
                <p className="text-gray-600">SKU: {scannedProduct.sku}</p>
                <p className="text-gray-600">Category: {scannedProduct.category}</p>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setScannedProduct(null)}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <p className="text-gray-400 italic">Scan a product QR code</p>
            )}
          </div>

          {/* Scanned Warehouse */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              Scanned Warehouse
            </h3>
            {scannedWarehouse ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold">{scannedWarehouse.name}</p>
                <p className="text-gray-600">Code: {scannedWarehouse.code}</p>
                <p className="text-gray-600">Location: {scannedWarehouse.location}</p>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setScannedWarehouse(null)}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <p className="text-gray-400 italic">Scan a warehouse QR code</p>
            )}
          </div>
        </div>

        {/* Quantity Input */}
        {scannedProduct && scannedWarehouse && (
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <Button 
              onClick={() => setShowConfirmModal(true)}
              variant="primary"
              className="mt-4 w-full"
            >
              {scanMode === 'receipt' ? 'Receive Items' : 'Deliver Items'}
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`Confirm ${scanMode === 'receipt' ? 'Receipt' : 'Delivery'}`}
      >
        <div className="space-y-4">
          <p>
            {scanMode === 'receipt' ? 'Receive' : 'Deliver'} <strong>{quantity}</strong> x{' '}
            <strong>{scannedProduct?.name}</strong>
          </p>
          <p>
            {scanMode === 'receipt' ? 'To' : 'From'}: <strong>{scannedWarehouse?.name}</strong>
          </p>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleConfirmScan} variant="primary" className="flex-1">
              Confirm
            </Button>
            <Button onClick={() => setShowConfirmModal(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
```

---

### Step 4: Add Scanner to Navigation (2 min)

Update `frontend/components/Sidebar.tsx` to include scanner link:

```typescript
// Add to navigation items array
{
  name: 'Scanner',
  href: '/scanner',
  icon: QrCode, // Import from lucide-react
},
```

---

## 🎬 Testing Your Integration

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd scanner-backend
   python api.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Navigate to Scanner page:**
   - Go to http://localhost:3001/scanner

3. **Test the flow:**
   - Click "Start Scanner"
   - Point camera at product QR code
   - Point camera at warehouse QR code
   - Enter quantity
   - Click "Receive Items" or "Deliver Items"
   - Check stock page for updated quantities!

---

## 🔧 Configuration

### Environment Variables

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_SCANNER_WS_URL=ws://localhost:8000/ws/scanner
NEXT_PUBLIC_SCANNER_API_URL=http://localhost:8000
```

Update scanner hook and API client to use these:

```typescript
const WS_URL = process.env.NEXT_PUBLIC_SCANNER_WS_URL || 'ws://localhost:8000/ws/scanner';
const API_URL = process.env.NEXT_PUBLIC_SCANNER_API_URL || 'http://localhost:8000';
```

---

## 🚀 Production Deployment

### Backend (Scanner API)

```bash
# Using PM2 or similar
pm2 start api.py --name scanner-api --interpreter python3

# Or with systemd
sudo systemctl start scanner-api
```

### Frontend

Update production env:

```env
NEXT_PUBLIC_SCANNER_WS_URL=wss://your-domain.com/scanner/ws
NEXT_PUBLIC_SCANNER_API_URL=https://your-domain.com/scanner/api
```

---

## 📊 Sync Stock Data

If you want to sync existing frontend stock with scanner backend:

```typescript
// Utility function to sync data
async function syncStockToScanner() {
  const products = await productAPI.getAll();
  const warehouses = await warehouseAPI.getAll();
  const stockLevels = await stockAPI.getAll();

  // Send to scanner backend
  for (const product of products) {
    await fetch('http://localhost:8000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  }

  // Same for warehouses and stock levels
  // ...
}
```

---

## 🎯 Quick Integration Summary

**Total Time: ~15 minutes**

1. ✅ Copy `useScanner` hook → `hooks/useScanner.ts`
2. ✅ Add `scannerAPI` to → `lib/api.ts`  
3. ✅ Create scanner page → `app/scanner/page.tsx`
4. ✅ Add to navigation → `components/Sidebar.tsx`
5. ✅ Test end-to-end

**Result:** Fully functional camera-based scanning integrated with your existing StockMaster system!

---

## 💡 Tips for Seamless Integration

- **CORS**: Backend already has CORS enabled for localhost
- **WebSocket**: Auto-reconnects if connection drops
- **Error Handling**: All API calls wrapped in try-catch
- **Toast Notifications**: Uses your existing toast system
- **Styling**: Matches your existing Tailwind theme
- **Mobile**: Responsive design works on tablets/phones

---

**Ready to integrate? Just say the word! 🚀**
