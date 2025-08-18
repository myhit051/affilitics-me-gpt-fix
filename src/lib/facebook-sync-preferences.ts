// Facebook Sync Preferences
// Manages user preferences for automatic Facebook data synchronization

export interface SyncPreferences {
  // General sync settings
  enableAutoSync: boolean;
  syncInterval: number; // minutes
  syncOnStartup: boolean;
  
  // Account selection
  selectedAccounts: string[];
  accountPreferences: Record<string, AccountSyncPreference>;
  
  // Sync options
  includeInsights: boolean;
  campaignStatus: string[];
  dateRangeType: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  customDateRange?: {
    since: string;
    until: string;
  };
  
  // Notification settings
  enableNotifications: boolean;
  notifyOnSuccess: boolean;
  notifyOnError: boolean;
  notifyOnQuotaWarning: boolean;
  
  // Advanced settings
  maxRetries: number;
  retryDelay: number; // milliseconds
  maxConcurrentSyncs: number;
  conflictResolution: 'skip' | 'queue' | 'cancel_existing';
  
  // Data retention
  keepSyncHistory: boolean;
  maxHistoryEntries: number;
  autoCleanupHistory: boolean;
}

export interface AccountSyncPreference {
  accountId: string;
  accountName: string;
  enabled: boolean;
  syncInterval?: number; // Override global interval
  lastSync?: Date;
  priority: number; // 1-10, higher is more important
}

export interface SyncNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  jobId?: string;
  accountId?: string;
  read: boolean;
  persistent: boolean; // Whether to keep after page refresh
}

export interface SyncPreferencesState {
  preferences: SyncPreferences;
  notifications: SyncNotification[];
  lastUpdated: Date;
}

export type PreferenceChangeListener = (preferences: SyncPreferences) => void;

export class FacebookSyncPreferencesManager {
  private static readonly STORAGE_KEY = 'facebook_sync_preferences';
  private static readonly NOTIFICATIONS_KEY = 'facebook_sync_notifications';
  
  private preferences: SyncPreferences;
  private notifications: SyncNotification[];
  private listeners: Set<PreferenceChangeListener>;

  constructor() {
    this.listeners = new Set();
    this.preferences = this.getDefaultPreferences();
    this.notifications = [];
    
    // Load saved preferences
    this.loadPreferences();
    this.loadNotifications();
  }

  // Get default preferences
  private getDefaultPreferences(): SyncPreferences {
    return {
      enableAutoSync: false,
      syncInterval: 60, // 1 hour
      syncOnStartup: false,
      
      selectedAccounts: [],
      accountPreferences: {},
      
      includeInsights: true,
      campaignStatus: ['ACTIVE', 'PAUSED'],
      dateRangeType: 'last_30_days',
      
      enableNotifications: true,
      notifyOnSuccess: false,
      notifyOnError: true,
      notifyOnQuotaWarning: true,
      
      maxRetries: 3,
      retryDelay: 5000,
      maxConcurrentSyncs: 2,
      conflictResolution: 'queue',
      
      keepSyncHistory: true,
      maxHistoryEntries: 100,
      autoCleanupHistory: true,
    };
  }

  // Load preferences from localStorage
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(FacebookSyncPreferencesManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.getDefaultPreferences(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load sync preferences:', error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem(
        FacebookSyncPreferencesManager.STORAGE_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Failed to save sync preferences:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(FacebookSyncPreferencesManager.NOTIFICATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load sync notifications:', error);
      this.notifications = [];
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    try {
      // Only save persistent notifications
      const persistentNotifications = this.notifications.filter(n => n.persistent);
      localStorage.setItem(
        FacebookSyncPreferencesManager.NOTIFICATIONS_KEY,
        JSON.stringify(persistentNotifications)
      );
    } catch (error) {
      console.error('Failed to save sync notifications:', error);
    }
  }

  // Get current preferences
  getPreferences(): SyncPreferences {
    return { ...this.preferences };
  }

  // Update preferences
  updatePreferences(updates: Partial<SyncPreferences>): void {
    const oldPreferences = { ...this.preferences };
    this.preferences = { ...this.preferences, ...updates };
    
    // Validate preferences
    this.validatePreferences();
    
    // Save to localStorage
    this.savePreferences();
    
    // Notify listeners
    this.notifyListeners();
    
    console.log('Sync preferences updated:', updates);
  }

  // Validate preferences
  private validatePreferences(): void {
    // Ensure sync interval is reasonable
    if (this.preferences.syncInterval < 5) {
      this.preferences.syncInterval = 5; // Minimum 5 minutes
    }
    if (this.preferences.syncInterval > 1440) {
      this.preferences.syncInterval = 1440; // Maximum 24 hours
    }

    // Ensure max retries is reasonable
    if (this.preferences.maxRetries < 0) {
      this.preferences.maxRetries = 0;
    }
    if (this.preferences.maxRetries > 10) {
      this.preferences.maxRetries = 10;
    }

    // Ensure max concurrent syncs is reasonable
    if (this.preferences.maxConcurrentSyncs < 1) {
      this.preferences.maxConcurrentSyncs = 1;
    }
    if (this.preferences.maxConcurrentSyncs > 10) {
      this.preferences.maxConcurrentSyncs = 10;
    }

    // Ensure max history entries is reasonable
    if (this.preferences.maxHistoryEntries < 10) {
      this.preferences.maxHistoryEntries = 10;
    }
    if (this.preferences.maxHistoryEntries > 1000) {
      this.preferences.maxHistoryEntries = 1000;
    }
  }

  // Reset preferences to defaults
  resetPreferences(): void {
    this.preferences = this.getDefaultPreferences();
    this.savePreferences();
    this.notifyListeners();
    console.log('Sync preferences reset to defaults');
  }

  // Account preference management
  updateAccountPreference(accountId: string, preference: Partial<AccountSyncPreference>): void {
    const existing = this.preferences.accountPreferences[accountId] || {
      accountId,
      accountName: '',
      enabled: true,
      priority: 5,
    };

    this.preferences.accountPreferences[accountId] = {
      ...existing,
      ...preference,
    };

    this.savePreferences();
    this.notifyListeners();
  }

  // Remove account preference
  removeAccountPreference(accountId: string): void {
    delete this.preferences.accountPreferences[accountId];
    
    // Also remove from selected accounts
    this.preferences.selectedAccounts = this.preferences.selectedAccounts.filter(
      id => id !== accountId
    );

    this.savePreferences();
    this.notifyListeners();
  }

  // Get account preference
  getAccountPreference(accountId: string): AccountSyncPreference | undefined {
    return this.preferences.accountPreferences[accountId];
  }

  // Get all account preferences
  getAccountPreferences(): Record<string, AccountSyncPreference> {
    return { ...this.preferences.accountPreferences };
  }

  // Update selected accounts
  updateSelectedAccounts(accountIds: string[]): void {
    this.preferences.selectedAccounts = [...accountIds];
    this.savePreferences();
    this.notifyListeners();
  }

  // Add selected account
  addSelectedAccount(accountId: string): void {
    if (!this.preferences.selectedAccounts.includes(accountId)) {
      this.preferences.selectedAccounts.push(accountId);
      this.savePreferences();
      this.notifyListeners();
    }
  }

  // Remove selected account
  removeSelectedAccount(accountId: string): void {
    this.preferences.selectedAccounts = this.preferences.selectedAccounts.filter(
      id => id !== accountId
    );
    this.savePreferences();
    this.notifyListeners();
  }

  // Check if account is selected
  isAccountSelected(accountId: string): boolean {
    return this.preferences.selectedAccounts.includes(accountId);
  }

  // Notification management
  addNotification(notification: Omit<SyncNotification, 'id' | 'timestamp' | 'read'>): string {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: SyncNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    this.notifications.unshift(newNotification);

    // Limit notifications to prevent memory issues
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    return id;
  }

  // Get notifications
  getNotifications(unreadOnly: boolean = false): SyncNotification[] {
    const notifications = unreadOnly 
      ? this.notifications.filter(n => !n.read)
      : this.notifications;
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Mark notification as read
  markNotificationRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllNotificationsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Remove notification
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  // Clear all notifications
  clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Get unread notification count
  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Preference change listeners
  addPreferenceChangeListener(listener: PreferenceChangeListener): void {
    this.listeners.add(listener);
  }

  removePreferenceChangeListener(listener: PreferenceChangeListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error('Error in preference change listener:', error);
      }
    });
  }

  // Export preferences
  exportPreferences(): string {
    return JSON.stringify({
      preferences: this.preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }

  // Import preferences
  importPreferences(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.preferences && typeof parsed.preferences === 'object') {
        this.preferences = { ...this.getDefaultPreferences(), ...parsed.preferences };
        this.validatePreferences();
        this.savePreferences();
        this.notifyListeners();
        
        console.log('Sync preferences imported successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import sync preferences:', error);
      return false;
    }
  }

  // Get sync configuration for scheduler
  getSyncConfiguration(): {
    defaultInterval: number;
    maxRetries: number;
    retryDelay: number;
    enableAutoSync: boolean;
    syncOnStartup: boolean;
    maxConcurrentSyncs: number;
  } {
    return {
      defaultInterval: this.preferences.syncInterval,
      maxRetries: this.preferences.maxRetries,
      retryDelay: this.preferences.retryDelay,
      enableAutoSync: this.preferences.enableAutoSync,
      syncOnStartup: this.preferences.syncOnStartup,
      maxConcurrentSyncs: this.preferences.maxConcurrentSyncs,
    };
  }

  // Get sync options for API service
  getSyncOptions(): {
    includeInsights: boolean;
    campaignStatus: string[];
    dateRange?: { since: string; until: string };
  } {
    const options: any = {
      includeInsights: this.preferences.includeInsights,
      campaignStatus: this.preferences.campaignStatus,
    };

    // Add date range based on type
    if (this.preferences.dateRangeType === 'custom' && this.preferences.customDateRange) {
      options.dateRange = this.preferences.customDateRange;
    } else {
      // Calculate date range based on type
      const now = new Date();
      const days = this.preferences.dateRangeType === 'last_7_days' ? 7 :
                   this.preferences.dateRangeType === 'last_30_days' ? 30 : 90;
      
      const since = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      options.dateRange = {
        since: since.toISOString().split('T')[0],
        until: now.toISOString().split('T')[0],
      };
    }

    return options;
  }

  // Cleanup old data
  cleanup(): void {
    if (this.preferences.autoCleanupHistory) {
      // Remove old notifications
      const cutoffDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days
      this.notifications = this.notifications.filter(
        n => n.persistent || n.timestamp > cutoffDate
      );
      
      this.saveNotifications();
    }
  }

  // Destroy instance
  destroy(): void {
    this.listeners.clear();
  }
}

// Create singleton instance
let preferencesInstance: FacebookSyncPreferencesManager | null = null;

// Factory function to get preferences manager instance
export function getFacebookSyncPreferences(): FacebookSyncPreferencesManager {
  if (!preferencesInstance) {
    preferencesInstance = new FacebookSyncPreferencesManager();
  }
  
  return preferencesInstance;
}

// Reset singleton instance (useful for testing)
export function resetFacebookSyncPreferences(): void {
  if (preferencesInstance) {
    preferencesInstance.destroy();
    preferencesInstance = null;
  }
}