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
  const { success: showSuccess, error: showError } = useToast();
  const [scanMode, setScanMode] = useState<'receipt' | 'delivery'>('receipt');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [scannedWarehouse, setScannedWarehouse] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        showSuccess('Product scanned: ' + barcodeData.name);
      } else if (barcodeData.type === 'warehouse') {
        setScannedWarehouse(barcodeData);
        showSuccess('Warehouse scanned: ' + barcodeData.name);
      }

      // Auto-show confirm modal when both are scanned
      if (scannedProduct && barcodeData.type === 'warehouse') {
        setShowConfirmModal(true);
      } else if (scannedWarehouse && barcodeData.type === 'product') {
        setShowConfirmModal(true);
      }
    } catch (err) {
      console.error('Invalid QR code format:', err);
      showError('Invalid QR code format');
    }
  }

  async function handleConfirmScan() {
    if (!scannedProduct || !scannedWarehouse) {
      showError('Please scan both product and warehouse');
      return;
    }

    setIsProcessing(true);
    try {
      const apiCall = scanMode === 'receipt' 
        ? scannerAPI.scanReceipt 
        : scannerAPI.scanDelivery;

      const result = await apiCall(
        JSON.stringify(scannedProduct),
        JSON.stringify(scannedWarehouse),
        quantity
      );

      if (result.ok || result.success) {
        showSuccess(
          `${scanMode === 'receipt' ? 'Received' : 'Delivered'} ${quantity} x ${scannedProduct.name}`
        );
        
        // Reset for next scan
        setScannedProduct(null);
        setScannedWarehouse(null);
        setQuantity(1);
        setShowConfirmModal(false);
      } else {
        showError(result.message || 'Scan failed');
      }
    } catch (error) {
      showError('Error processing scan');
    } finally {
      setIsProcessing(false);
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
                <p className="text-gray-600">Category: {scannedProduct.category || 'N/A'}</p>
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
                <p className="text-gray-600">Code: {scannedWarehouse.code || 'N/A'}</p>
                <p className="text-gray-600">Location: {scannedWarehouse.location || 'N/A'}</p>
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
              className="w-full px-4 py-2 border rounded-lg text-gray-900"
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
          <p className="text-gray-900">
            {scanMode === 'receipt' ? 'Receive' : 'Deliver'} <strong>{quantity}</strong> x{' '}
            <strong>{scannedProduct?.name}</strong>
          </p>
          <p className="text-gray-900">
            {scanMode === 'receipt' ? 'To' : 'From'}: <strong>{scannedWarehouse?.name}</strong>
          </p>
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={handleConfirmScan} 
              variant="primary" 
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
            <Button 
              onClick={() => setShowConfirmModal(false)} 
              variant="secondary" 
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
