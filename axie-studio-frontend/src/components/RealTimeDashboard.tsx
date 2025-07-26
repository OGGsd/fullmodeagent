import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Activity, Users, Zap, Server, Database, Wifi } from 'lucide-react';
import LiveMetricsWidget from './LiveMetricsWidget';
import RealTimeFlowStatus from './RealTimeFlowStatus';
import RealTimeActivityFeed from './RealTimeActivityFeed';
import ConnectionStatus from './ConnectionStatus';
import useRealTimeConnection from '../hooks/useRealTimeConnection';

interface RealTimeDashboardProps {
  className?: string;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ className = '' }) => {
  const connectionStatus = useRealTimeConnection();
  const [systemHealth, setSystemHealth] = useState({
    frontend: 'healthy',
    backend: connectionStatus.isConnected ? 'healthy' : 'down',
    database: 'healthy'
  });

  useEffect(() => {
    setSystemHealth(prev => ({
      ...prev,
      backend: connectionStatus.isConnected ? 'healthy' : 'down'
    }));
  }, [connectionStatus.isConnected]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'down':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <ConnectionStatus 
        isConnected={connectionStatus.isConnected}
        lastUpdate={connectionStatus.lastPing}
        latency={connectionStatus.latency}
        className="mb-4"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frontend</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getHealthIcon(systemHealth.frontend)}</span>
              <div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.frontend)}`}>
                  {systemHealth.frontend.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">Axie Studio UI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backend</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getHealthIcon(systemHealth.backend)}</span>
              <div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.backend)}`}>
                  {systemHealth.backend.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {connectionStatus.isConnected ? 'Live Connection' : 'Disconnected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getHealthIcon(systemHealth.database)}</span>
              <div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.database)}`}>
                  {systemHealth.database.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">PostgreSQL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LiveMetricsWidget />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeFlowStatus />
        <RealTimeActivityFeed />
      </div>
    </div>
  );
};

export default RealTimeDashboard;
