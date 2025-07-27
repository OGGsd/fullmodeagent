
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface RealTimeDashboardProps {
  className?: string;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Simplified</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The admin dashboard has been simplified to focus on core functionality.
            Use the tabs above to manage users, monitor system health, and configure settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDashboard;
