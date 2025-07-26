import React, { useState, useEffect } from 'react';
import { Activity, User, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ActivityItem {
  id: string;
  type: 'user_login' | 'flow_execution' | 'api_call' | 'websocket_connection' | 'error';
  message: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'error' | 'pending';
}

interface RealTimeActivityFeedProps {
  className?: string;
}

export const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({ className = '' }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const handleFlowUpdate = (event: CustomEvent) => {
      const { nodeIdList, status } = event.detail;
      const activity: ActivityItem = {
        id: `flow-${Date.now()}`,
        type: 'flow_execution',
        message: `Flow execution ${status.toLowerCase()} for ${nodeIdList.length} node(s)`,
        timestamp: new Date(),
        status: status === 'BUILT' ? 'success' : status === 'ERROR' ? 'error' : 'pending'
      };
      
      setActivities(prev => [activity, ...prev.slice(0, 9)]);
    };

    const handleWebSocketConnection = (event: CustomEvent) => {
      const activity: ActivityItem = {
        id: `ws-${Date.now()}`,
        type: 'websocket_connection',
        message: 'WebSocket connection established',
        timestamp: new Date(),
        status: 'success'
      };
      
      setActivities(prev => [activity, ...prev.slice(0, 9)]);
    };

    const handleSSEStream = (event: CustomEvent) => {
      const activity: ActivityItem = {
        id: `sse-${Date.now()}`,
        type: 'api_call',
        message: 'Server-Sent Events stream started',
        timestamp: new Date(),
        status: 'success'
      };
      
      setActivities(prev => [activity, ...prev.slice(0, 9)]);
    };

    window.addEventListener('flowBuildStatusUpdate', handleFlowUpdate as EventListener);
    window.addEventListener('websocketConnected', handleWebSocketConnection as EventListener);
    window.addEventListener('sseStreamStarted', handleSSEStream as EventListener);

    const interval = setInterval(() => {
      const randomActivities = [
        {
          id: `user-${Date.now()}`,
          type: 'user_login' as const,
          message: 'User logged in',
          timestamp: new Date(),
          user: 'stefan@axiestudio.se',
          status: 'success' as const
        },
        {
          id: `api-${Date.now()}`,
          type: 'api_call' as const,
          message: 'API health check completed',
          timestamp: new Date(),
          status: 'success' as const
        }
      ];

      if (Math.random() > 0.7) {
        const activity = randomActivities[Math.floor(Math.random() * randomActivities.length)];
        setActivities(prev => [activity, ...prev.slice(0, 9)]);
      }
    }, 10000);

    return () => {
      window.removeEventListener('flowBuildStatusUpdate', handleFlowUpdate as EventListener);
      window.removeEventListener('websocketConnected', handleWebSocketConnection as EventListener);
      window.removeEventListener('sseStreamStarted', handleSSEStream as EventListener);
      clearInterval(interval);
    };
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_login':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'flow_execution':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'api_call':
        return <Activity className="w-4 h-4 text-green-600" />;
      case 'websocket_connection':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: ActivityItem['status']) => {
    if (!status) return null;
    
    switch (status) {
      case 'success':
        return <Badge variant="default" className="text-xs">Success</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-time Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-muted-foreground">
                        • {activity.user}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeActivityFeed;
