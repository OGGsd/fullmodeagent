import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BuildStatus } from '../constants/enums';

interface FlowExecution {
  id: string;
  name: string;
  status: BuildStatus;
  startTime: Date;
  duration?: number;
  progress: number;
}

interface RealTimeFlowStatusProps {
  className?: string;
}

export const RealTimeFlowStatus: React.FC<RealTimeFlowStatusProps> = ({ className = '' }) => {
  const [executions, setExecutions] = useState<FlowExecution[]>([]);

  useEffect(() => {
    const handleFlowUpdate = (event: CustomEvent) => {
      const { nodeIdList, status, timestamp } = event.detail;
      
      setExecutions(prev => {
        const updated = [...prev];
        nodeIdList.forEach((nodeId: string) => {
          const existingIndex = updated.findIndex(exec => exec.id === nodeId);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              status,
              duration: status === BuildStatus.BUILT ? Date.now() - updated[existingIndex].startTime.getTime() : undefined,
              progress: status === BuildStatus.BUILT ? 100 : status === BuildStatus.BUILDING ? 50 : 0
            };
          } else if (status === BuildStatus.BUILDING) {
            updated.push({
              id: nodeId,
              name: `Flow ${nodeId.slice(0, 8)}`,
              status,
              startTime: new Date(timestamp),
              progress: 25
            });
          }
        });
        
        return updated.slice(-5);
      });
    };

    window.addEventListener('flowBuildStatusUpdate', handleFlowUpdate as EventListener);
    
    return () => {
      window.removeEventListener('flowBuildStatusUpdate', handleFlowUpdate as EventListener);
    };
  }, []);

  const getStatusIcon = (status: BuildStatus) => {
    switch (status) {
      case BuildStatus.BUILDING:
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case BuildStatus.BUILT:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case BuildStatus.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: BuildStatus) => {
    switch (status) {
      case BuildStatus.BUILDING:
        return <Badge variant="secondary">Building</Badge>;
      case BuildStatus.BUILT:
        return <Badge variant="default">Complete</Badge>;
      case BuildStatus.ERROR:
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Real-time Flow Executions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active flow executions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <p className="font-medium text-sm">{execution.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Started {execution.startTime.toLocaleTimeString()}
                      {execution.duration && ` • ${execution.duration}ms`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(execution.status)}
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${execution.progress}%` }}
                    />
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

export default RealTimeFlowStatus;
