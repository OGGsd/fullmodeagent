import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Badge } from './ui/badge';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate?: Date | null;
  latency?: number;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastUpdate,
  latency,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <div className="flex items-center gap-1">
            <Wifi className="w-4 h-4 text-green-600" />
            <Badge variant="outline" className="text-green-600 border-green-600">
              Connected
            </Badge>
          </div>
          {latency && (
            <span className="text-xs text-muted-foreground">
              {latency}ms
            </span>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1">
          <WifiOff className="w-4 h-4 text-red-600" />
          <Badge variant="outline" className="text-red-600 border-red-600">
            Disconnected
          </Badge>
        </div>
      )}
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
