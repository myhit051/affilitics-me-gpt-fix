/**
 * Facebook Connection Panel
 * Lazy-loaded component for Facebook API connection management
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Facebook,
  Settings,
  RefreshCw,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Unlink
} from "lucide-react";
import { FacebookConnectionState, FacebookAdAccount } from "@/types/facebook";
import { SyncProgress } from "@/lib/facebook-api-service";
import { getFacebookConfig } from "@/config/facebook";
import FacebookConfigChecker from "./FacebookConfigChecker";
import FacebookSetupStatus from "./FacebookSetupStatus";
import FacebookAppActivationHelper from "./FacebookAppActivationHelper";
import { isFacebookReady } from "@/utils/facebook-config-validator";

interface FacebookConnectionPanelProps {
  connectionState: FacebookConnectionState;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: (accountIds: string[]) => Promise<void>;
  onAccountSelectionChange: (accountIds: string[]) => void;
  selectedAccounts: string[];
  syncProgress?: SyncProgress;
  isConnecting: boolean;
  isSyncing: boolean;
}

const FacebookConnectionPanel: React.FC<FacebookConnectionPanelProps> = ({
  connectionState,
  onConnect,
  onDisconnect,
  onSync,
  onAccountSelectionChange,
  selectedAccounts,
  syncProgress,
  isConnecting,
  isSyncing,
}) => {
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const handleAccountToggle = useCallback((accountId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedAccounts, accountId]
      : selectedAccounts.filter(id => id !== accountId);
    onAccountSelectionChange(newSelection);
  }, [selectedAccounts, onAccountSelectionChange]);

  const handleSyncClick = useCallback(() => {
    if (selectedAccounts.length > 0) {
      onSync(selectedAccounts);
    }
  }, [selectedAccounts, onSync]);

  const renderConnectionStatus = () => {
    const isReady = isFacebookReady();

    if (!connectionState.isConnected) {
      // Show setup status if config needs attention
      if (!isReady) {
        return <FacebookSetupStatus />;
      }

      return (
        <div className="space-y-4">
          <div className="text-center py-6">
            <Facebook className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Connect Facebook API</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Facebook advertising account to automatically sync campaign data
            </p>
            <Button 
              onClick={onConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Facebook className="mr-2 h-4 w-4" />
                  Connect Facebook
                </>
              )}
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be redirected to Facebook to authorize access to your advertising data.
              We only request read permissions for campaigns and insights.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                Facebook Connected
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {connectionState.connectedAccounts.length} ad account(s) available
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Unlink className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>

        {/* Last Sync Info */}
        {connectionState.lastSyncTime && (
          <div className="text-sm text-muted-foreground">
            Last synced: {new Date(connectionState.lastSyncTime).toLocaleString()}
          </div>
        )}

        {/* Account Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Select Ad Accounts</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccountSelector(!showAccountSelector)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {showAccountSelector ? 'Hide' : 'Show'} Accounts
            </Button>
          </div>

          {showAccountSelector && (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {connectionState.connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={account.id}
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={(checked) => 
                      handleAccountToggle(account.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={account.id}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div className="font-medium">{account.name}</div>
                    <div className="text-muted-foreground">
                      {account.currency} • {account.accountStatus}
                    </div>
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {account.currency}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {selectedAccounts.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedAccounts.length} account(s) selected for sync
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleSyncClick}
            disabled={isSyncing || selectedAccounts.length === 0}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Data
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Sync Progress */}
        {syncProgress && isSyncing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Syncing {syncProgress.phase}...</span>
              <span>
                {syncProgress.accountsProcessed}/{syncProgress.totalAccounts} accounts
              </span>
            </div>
            <Progress 
              value={(syncProgress.accountsProcessed / syncProgress.totalAccounts) * 100} 
              className="h-2"
            />
            {syncProgress.currentAccount && (
              <div className="text-xs text-muted-foreground">
                Current: {syncProgress.currentAccount}
              </div>
            )}
            {syncProgress.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {syncProgress.errors.length} error(s) occurred during sync
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Error Display */}
        {connectionState.error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionState.error}
              </AlertDescription>
            </Alert>
            
            {/* Show activation helper for specific errors */}
            {(connectionState.error.includes('App not active') || 
              connectionState.error.includes('not currently accessible') ||
              connectionState.error.includes('Facebook App ID is not configured')) && (
              <FacebookAppActivationHelper />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-500" />
          Facebook API Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderConnectionStatus()}
      </CardContent>
    </Card>
  );
};

export default FacebookConnectionPanel;