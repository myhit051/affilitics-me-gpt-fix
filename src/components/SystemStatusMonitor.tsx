import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Wifi, 
  Database,
  RefreshCw
} from 'lucide-react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { getFacebookErrorHandler } from '@/lib/facebook-error-handler';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error';
  facebook: 'connected' | 'disconnected' | 'error';
  performance: 'good' | 'degraded' | 'poor';
  errors: number;
  lastUpdate: Date;
}

export function SystemStatusMonitor() {
  const [status, setStatus] = useState<SystemStatus>({
    overall: 'healthy',
    facebook: 'disconnected',
    performance: 'good',
    errors: 0,
    lastUpdate: new Date(),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkSystemStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check Facebook connection
      const facebookConnected = localStorage.getItem('facebook_token') !== null;
      
      // Check performance metrics
      const perfSummary = performanceMonitor.getPerformanceSummary();
      let performanceStatus: 'good' | 'degraded' | 'poor' = 'good';
      
      if (perfSummary.averagePageLoad > 3000 || perfSummary.averageAPIResponse > 5000) {
        performanceStatus = 'poor';
      } else if (perfSummary.averagePageLoad > 2000 || perfSummary.averageAPIResponse > 3000) {
        performanceStatus = 'degraded';
      }

      // Check error count
      const errorHandler = getFacebookErrorHandler();
      const errorStats = errorHandler.getErrorStats();
      const recentErrors = errorStats.unresolved;

      // Determine overall status
      let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      if (recentErrors > 5 || performanceStatus === 'poor') {
        overallStatus = 'error';
      } else if (recentErrors > 0 || performanceStatus === 'degraded' || !facebookConnected) {
        overallStatus = 'warning';
      }

      setStatus({
        overall: overallStatus,
        facebook: facebookConnected ? 'connected' : 'disconnected',
        performance: performanceStatus,
        errors: recentErrors,
        lastUpdate: new Date(),
      });

    } catch (error) {
      console.error('Failed to check system status:', error);
      setStatus(prev => ({
        ...prev,
        overall: 'error',
        lastUpdate: new Date(),
      }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkSystemStatus();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'disconnected':
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'disconnected':
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <CardDescription>
            Last updated: {status.lastUpdate.toLocaleTimeString('th-TH')}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status Alert */}
        {status.overall !== 'healthy' && (
          <Alert variant={status.overall === 'error' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {status.overall === 'error' 
                ? 'System experiencing issues. Some features may not work properly.'
                : 'System running with warnings. Check individual components below.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facebook Connection */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Facebook API</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.facebook)}
              <Badge className={getStatusColor(status.facebook)}>
                {status.facebook}
              </Badge>
            </div>
          </div>

          {/* Performance */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.performance)}
              <Badge className={getStatusColor(status.performance)}>
                {status.performance}
              </Badge>
            </div>
          </div>

          {/* Errors */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Errors</span>
            </div>
            <div className="flex items-center space-x-2">
              {status.errors > 0 ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <Badge className={status.errors > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {status.errors}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {status.overall !== 'healthy' && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {status.facebook === 'disconnected' && (
                <Button variant="outline" size="sm">
                  Connect Facebook
                </Button>
              )}
              {status.errors > 0 && (
                <Button variant="outline" size="sm">
                  View Error Log
                </Button>
              )}
              {status.performance !== 'good' && (
                <Button variant="outline" size="sm">
                  Performance Report
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}