/**
 * Facebook Sync Settings
 * Lazy-loaded component for Facebook sync preferences and scheduling
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Clock,
  Calendar,
  BarChart3,
  Info,
  Save,
  RotateCcw
} from "lucide-react";

export interface FacebookSyncPreferences {
  autoSync: boolean;
  syncInterval: number; // in minutes
  selectedAccounts: string[];
  includeInsights: boolean;
  syncCampaigns: boolean;
  syncAdSets: boolean;
  syncAds: boolean;
  dateRange: {
    type: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
    customStart?: string;
    customEnd?: string;
  };
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onLargeDatasets: boolean;
  };
}

interface FacebookSyncSettingsProps {
  preferences: FacebookSyncPreferences;
  onPreferencesChange: (preferences: FacebookSyncPreferences) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isSaving?: boolean;
  availableAccounts: Array<{ id: string; name: string; currency: string }>;
}

const FacebookSyncSettings: React.FC<FacebookSyncSettingsProps> = ({
  preferences,
  onPreferencesChange,
  onSave,
  onReset,
  isSaving = false,
  availableAccounts,
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updatePreferences = useCallback((updates: Partial<FacebookSyncPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    onPreferencesChange(newPreferences);
    setHasUnsavedChanges(true);
  }, [preferences, onPreferencesChange]);

  const handleSave = useCallback(async () => {
    await onSave();
    setHasUnsavedChanges(false);
  }, [onSave]);

  const handleReset = useCallback(() => {
    onReset();
    setHasUnsavedChanges(false);
  }, [onReset]);

  const syncIntervalOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '8 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' },
  ];

  const dateRangeOptions = [
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_90_days', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' },
  ];

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Facebook Sync Settings
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Sync Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Automatic Sync
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-sync">Enable automatic sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync Facebook data at regular intervals
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={preferences.autoSync}
              onCheckedChange={(checked) => updatePreferences({ autoSync: checked })}
            />
          </div>

          {preferences.autoSync && (
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync interval</Label>
              <Select
                value={preferences.syncInterval.toString()}
                onValueChange={(value) => updatePreferences({ syncInterval: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {syncIntervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                More frequent syncing may consume API quota faster
              </p>
            </div>
          )}
        </div>

        {/* Data Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data to Sync
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-campaigns">Campaigns</Label>
                <p className="text-sm text-muted-foreground">
                  Campaign information and basic metrics
                </p>
              </div>
              <Switch
                id="sync-campaigns"
                checked={preferences.syncCampaigns}
                onCheckedChange={(checked) => updatePreferences({ syncCampaigns: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-adsets">Ad Sets</Label>
                <p className="text-sm text-muted-foreground">
                  Ad set details and targeting information
                </p>
              </div>
              <Switch
                id="sync-adsets"
                checked={preferences.syncAdSets}
                onCheckedChange={(checked) => updatePreferences({ syncAdSets: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-ads">Individual Ads</Label>
                <p className="text-sm text-muted-foreground">
                  Individual ad performance and creative data
                </p>
              </div>
              <Switch
                id="sync-ads"
                checked={preferences.syncAds}
                onCheckedChange={(checked) => updatePreferences({ syncAds: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="include-insights">Detailed Insights</Label>
                <p className="text-sm text-muted-foreground">
                  Performance metrics and conversion data
                </p>
              </div>
              <Switch
                id="include-insights"
                checked={preferences.includeInsights}
                onCheckedChange={(checked) => updatePreferences({ includeInsights: checked })}
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="date-range">Default date range for sync</Label>
            <Select
              value={preferences.dateRange.type}
              onValueChange={(value) => updatePreferences({ 
                dateRange: { 
                  ...preferences.dateRange, 
                  type: value as FacebookSyncPreferences['dateRange']['type']
                }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-success">Sync success notifications</Label>
              <Switch
                id="notify-success"
                checked={preferences.notifications.onSuccess}
                onCheckedChange={(checked) => updatePreferences({ 
                  notifications: { ...preferences.notifications, onSuccess: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-error">Sync error notifications</Label>
              <Switch
                id="notify-error"
                checked={preferences.notifications.onError}
                onCheckedChange={(checked) => updatePreferences({ 
                  notifications: { ...preferences.notifications, onError: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notify-large">Large dataset warnings</Label>
              <Switch
                id="notify-large"
                checked={preferences.notifications.onLargeDatasets}
                onCheckedChange={(checked) => updatePreferences({ 
                  notifications: { ...preferences.notifications, onLargeDatasets: checked }
                })}
              />
            </div>
          </div>
        </div>

        {/* Performance Warning */}
        {(preferences.syncInterval < 60 || preferences.includeInsights) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {preferences.syncInterval < 60 && 
                "Frequent syncing (< 1 hour) may consume your Facebook API quota quickly. "
              }
              {preferences.includeInsights && 
                "Including detailed insights increases sync time and API usage. "
              }
              Consider adjusting these settings if you encounter rate limits.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacebookSyncSettings;