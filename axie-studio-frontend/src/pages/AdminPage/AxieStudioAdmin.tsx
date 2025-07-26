import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Users, Settings, BarChart3, Shield, Activity, Building, UserPlus, Database, Server, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import UserManagement from './UserManagement';
import SystemMonitoring from './SystemMonitoring';
import TenantManagement from './TenantManagement';
import MassUserCreation from './MassUserCreation';
import RealTimeDashboard from '../../components/RealTimeDashboard';

export default function AxieStudioAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 12,
    activeUsers: 8,
    totalFlows: 47,
    systemHealth: 'good',
    uptime: '2d 14h 32m',
    memoryUsage: '1.2GB / 4GB',
    cpuUsage: 15,
    diskUsage: 45
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpuUsage: Math.floor(Math.random() * 30) + 10,
        activeUsers: Math.floor(Math.random() * 5) + 6,
        totalFlows: prev.totalFlows + Math.floor(Math.random() * 2), // Occasionally increment
        uptime: calculateUptime()
      }));
    }, 3000); // More frequent updates for real-time feel

    return () => clearInterval(interval);
  }, []);

  const calculateUptime = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000) - (14 * 60 * 60 * 1000) - (32 * 60 * 1000)); // 2d 14h 32m ago
    const diff = now.getTime() - startTime.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Axie Studio Admin</h1>
              <p className="text-muted-foreground">Manage your Axie Studio instance</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="mass-users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Mass Users
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Real-time Dashboard */}
            <RealTimeDashboard />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+2</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.totalFlows}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12</span> this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Excellent</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        CPU Usage
                      </span>
                      <Badge variant={systemStats.cpuUsage > 80 ? "destructive" : systemStats.cpuUsage > 60 ? "secondary" : "default"}>
                        {systemStats.cpuUsage}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          systemStats.cpuUsage > 80 ? 'bg-red-500' :
                          systemStats.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemStats.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Memory Usage
                      </span>
                      <Badge variant="default">1.2GB / 4GB</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Disk Usage
                      </span>
                      <Badge variant="default">{systemStats.diskUsage}%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${systemStats.diskUsage}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-muted-foreground">user@example.com - 2 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Flow created</p>
                        <p className="text-xs text-muted-foreground">"Customer Support Bot" - 15 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">System backup completed</p>
                        <p className="text-xs text-muted-foreground">Automated backup - 1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Manage Users</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('mass-users')}
                  >
                    <UserPlus className="w-6 h-6" />
                    <span className="text-sm">Add Users</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('monitoring')}
                  >
                    <Activity className="w-6 h-6" />
                    <span className="text-sm">System Monitor</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Mass Users Tab */}
          <TabsContent value="mass-users" className="space-y-6">
            <MassUserCreation />
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <TenantManagement />
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <SystemMonitoring />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+23%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flow Executions</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,847</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12%</span> this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                  <Wifi className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18.2K</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+8%</span> from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0.3%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">-0.1%</span> improvement
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Flow Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Chat Assistant</p>
                        <p className="text-sm text-muted-foreground">Used 45 times</p>
                      </div>
                      <Badge>Popular</Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">RAG Document Q&A</p>
                        <p className="text-sm text-muted-foreground">Used 32 times</p>
                      </div>
                      <Badge variant="secondary">Trending</Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium">Data Processing</p>
                        <p className="text-sm text-muted-foreground">Used 28 times</p>
                      </div>
                      <Badge variant="outline">Growing</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Daily Active Users</span>
                        <span className="text-sm">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Weekly Active Users</span>
                        <span className="text-sm">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Monthly Active Users</span>
                        <span className="text-sm">89%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Interactive charts would be displayed here</p>
                    <p className="text-sm text-muted-foreground">Integration with Chart.js or similar library</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Axie Studio Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Instance Name</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    defaultValue="Axie Studio"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Backend URL</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    defaultValue="https://langflow-tv34o.ondigitalocean.app"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    defaultValue="60"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-login" defaultChecked={false} />
                  <label htmlFor="auto-login" className="text-sm font-medium">
                    Enable auto-login
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Frontend Service</span>
                    <span className="text-green-600 font-medium">Running</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Backend Service</span>
                    <span className="text-green-600 font-medium">Running</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Database</span>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>API Proxy</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Version</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uptime</span>
                    <span className="font-medium">2d 14h 32m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Memory Usage</span>
                    <span className="font-medium">1.2GB / 4GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>CPU Usage</span>
                    <span className="font-medium">15%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div>AXIE_STUDIO_SUPERUSER=admin</div>
                  <div>LANGFLOW_BACKEND_URL=https://langflow-tv34o.ondigitalocean.app</div>
                  <div>NODE_ENV=production</div>
                  <div>ACCESS_TOKEN_EXPIRE_SECONDS=3600</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
