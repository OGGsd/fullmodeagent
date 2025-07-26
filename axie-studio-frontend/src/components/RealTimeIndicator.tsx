import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface RealTimeIndicatorProps {
  isConnected?: boolean;
  lastUpdate?: Date | null;
  className?: string;
}

export const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  isConnected = true,
  lastUpdate,
  className = ''
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setPulse(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-600" />
            {pulse && (
              <div className="absolute inset-0 w-4 h-4 bg-green-600 rounded-full animate-ping opacity-20" />
            )}
          </div>
          <span className="text-xs text-green-600 font-medium">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-600" />
          <span className="text-xs text-red-600 font-medium">Offline</span>
        </>
      )}
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default RealTimeIndicator;
