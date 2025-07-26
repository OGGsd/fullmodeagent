import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LiveMetric {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface LiveMetricsWidgetProps {
  className?: string;
}

export const LiveMetricsWidget: React.FC<LiveMetricsWidgetProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    {
      label: 'Active Users',
      value: 0,
      change: 0,
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Flow Executions',
      value: 0,
      change: 0,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-green-600'
    },
    {
      label: 'API Calls',
      value: 0,
      change: 0,
      icon: <Zap className="w-4 h-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Success Rate',
      value: '0%',
      change: 0,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-emerald-600'
    }
  ]);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.label === 'Success Rate' 
          ? `${(Math.random() * 20 + 80).toFixed(1)}%`
          : Math.floor(Math.random() * 100) + 50,
        change: Math.floor(Math.random() * 20) - 10
      })));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            <div className={metric.color}>{metric.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.change !== undefined && (
              <p className="text-xs text-muted-foreground">
                <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}
                </span>{' '}
                from last hour
              </p>
            )}
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
        </Card>
      ))}
    </div>
  );
};

export default LiveMetricsWidget;
