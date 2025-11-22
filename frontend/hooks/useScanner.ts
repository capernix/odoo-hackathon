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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_SCANNER_WS_URL || 'ws://localhost:8000/ws/scanner';
    
    try {
      const ws = new WebSocket(`${wsUrl}/${cameraId}`);
      
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
