/**
 * Facebook Configuration Checker
 * Component to help users identify and fix Facebook API configuration issues
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings,
  ExternalLink,
  Copy
} from "lucide-react";
import { getFacebookConfig, validateRuntimeConfig, performHealthCheck } from "@/config/facebook";

const FacebookConfigChecker: React.FC = () => {
  const config = getFacebookConfig();
  const validation = validateRuntimeConfig();
  const healthCheck = performHealthCheck();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Facebook API Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${getStatusColor(
          healthCheck.status === 'healthy' ? 'pass' : 
          healthCheck.status === 'warning' ? 'warn' : 'fail'
        )}`}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(
              healthCheck.status === 'healthy' ? 'pass' : 
              healthCheck.status === 'warning' ? 'warn' : 'fail'
            )}
            <span className="font-medium">
              Overall Status: {healthCheck.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Configuration Checks */}
        <div className="space-y-3">
          <h3 className="font-medium text-lg">Configuration Checks</h3>
          {healthCheck.checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-muted-foreground">{check.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Configuration */}
        <div className="space-y-3">
          <h3 className="font-medium text-lg">Current Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">App ID:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={config.FACEBOOK_APP_ID && config.FACEBOOK_APP_ID !== 'your_facebook_app_id_here' ? 'default' : 'destructive'}>
                    {config.FACEBOOK_APP_ID ? 
                      (config.FACEBOOK_APP_ID === 'your_facebook_app_id_here' ? 'Not Set' : 'Configured') : 
                      'Missing'
                    }
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Version:</span>
                <Badge variant="outline">{config.FACEBOOK_API_VERSION}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scopes:</span>
                <Badge variant="outline">{config.FACEBOOK_SCOPES.length} configured</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Redirect URI:</span>
                <Badge variant="outline" className="max-w-48 truncate">
                  {new URL(config.FACEBOOK_REDIRECT_URI).pathname}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <Badge variant="outline">{import.meta.env.MODE}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Errors and Warnings */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Configuration Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Configuration Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Instructions */}
        {(!config.FACEBOOK_APP_ID || config.FACEBOOK_APP_ID === 'your_facebook_app_id_here') && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Setup Instructions</h3>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">To fix the Facebook authentication issue:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Go to the{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                      >
                        Facebook Developer Console
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </li>
                    <li>Create a new app or select an existing one</li>
                    <li>Copy your App ID from the app dashboard</li>
                    <li>
                      Add this line to your <code>.env.local</code> file:
                      <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                        <span>VITE_FACEBOOK_APP_ID=your_actual_app_id_here</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard('VITE_FACEBOOK_APP_ID=your_actual_app_id_here')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                    <li>
                      Configure your app's OAuth redirect URI to:
                      <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                        <span>{config.FACEBOOK_REDIRECT_URI}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(config.FACEBOOK_REDIRECT_URI)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()}>
            Refresh Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacebookConfigChecker;