import { useState, useEffect, useCallback } from 'react';

interface ConnectionStatus {
  isConnected: boolean;
  lastPing: Date | null;
  latency: number;
  retryCount: number;
}

export const useRealTimeConnection = (pingInterval: number = 30000) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastPing: null,
    latency: 0,
    retryCount: 0
  });

  const pingBackend = useCallback(async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/v1/health');
      if (response.ok) {
        const latency = Date.now() - startTime;
        
        setStatus(prev => ({
          isConnected: true,
          lastPing: new Date(),
          latency,
          retryCount: 0
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          isConnected: false,
          retryCount: prev.retryCount + 1
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

  useEffect(() => {
    pingBackend();

    const interval = setInterval(pingBackend, pingInterval);

    return () => clearInterval(interval);
  }, [pingBackend, pingInterval]);

  return {
    ...status,
    ping: pingBackend
  };
};

export default useRealTimeConnection;
