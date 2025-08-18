// Tests for Facebook Sync Preferences

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  FacebookSyncPreferencesManager, 
  getFacebookSyncPreferences, 
  resetFacebookSyncPreferences,
  SyncPreferences,
  AccountSyncPreference,
  SyncNotification
} from '../facebook-sync-preferences';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('FacebookSyncPreferencesManager', () => {
  let preferencesManager: FacebookSyncPreferencesManager;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    preferencesManager = new FacebookSyncPreferencesManager();
    resetFacebookSyncPreferences();
  });

  afterEach(() => {
    preferencesManager.destroy();
  });

  describe('Default Preferences', () => {
    it('should initialize with default preferences', () => {
      const preferences = preferencesManager.getPreferences();
      
      expect(preferences.enableAutoSync).toBe(false);
      expect(preferences.syncInterval).toBe(60);
      expect(preferences.syncOnStartup).toBe(false);
      expect(preferences.selectedAccounts).toEqual([]);
      expect(preferences.includeInsights).toBe(true);
      expect(preferences.campaignStatus).toEqual(['ACTIVE', 'PAUSED']);
      expect(preferences.dateRangeType).toBe('last_30_days');
      expect(preferences.enableNotifications).toBe(true);
      expect(preferences.maxRetries).toBe(3);
      expect(preferences.maxConcurrentSyncs).toBe(2);
      expect(preferences.conflictResolution).toBe('queue');
    });

    it('should load preferences from localStorage', () => {
      const savedPreferences = {
        enableAutoSync: true,
        syncInterval: 120,
        selectedAccounts: ['account1', 'account2'],
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences));
      
      const manager = new FacebookSyncPreferencesManager();
      const preferences = manager.getPreferences();
      
      expect(preferences.enableAutoSync).toBe(true);
      expect(preferences.syncInterval).toBe(120);
      expect(preferences.selectedAccounts).toEqual(['account1', 'account2']);
      
      manager.destroy();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const manager = new FacebookSyncPreferencesManager();
      const preferences = manager.getPreferences();
      
      // Should fall back to defaults
      expect(preferences.enableAutoSync).toBe(false);
      expect(preferences.syncInterval).toBe(60);
      
      manager.destroy();
    });
  });

  describe('Preference Updates', () => {
    it('should update preferences', () => {
      const updates = {
        enableAutoSync: true,
        syncInterval: 30,
        includeInsights: false,
      };
      
      preferencesManager.updatePreferences(updates);
      
      const preferences = preferencesManager.getPreferences();
      expect(preferences.enableAutoSync).toBe(true);
      expect(preferences.syncInterval).toBe(30);
      expect(preferences.includeInsights).toBe(false);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'facebook_sync_preferences',
        expect.stringContaining('"enableAutoSync":true')
      );
    });

    it('should validate preferences on update', () => {
      preferencesManager.updatePreferences({
        syncInterval: 2, // Below minimum
        maxRetries: 15, // Above maximum
        maxConcurrentSyncs: 0, // Below minimum
      });
      
      const preferences = preferencesManager.getPreferences();
      expect(preferences.syncInterval).toBe(5); // Corrected to minimum
      expect(preferences.maxRetries).toBe(10); // Corrected to maximum
      expect(preferences.maxConcurrentSyncs).toBe(1); // Corrected to minimum
    });

    it('should reset preferences to defaults', () => {
      preferencesManager.updatePreferences({
        enableAutoSync: true,
        syncInterval: 120,
      });
      
      preferencesManager.resetPreferences();
      
      const preferences = preferencesManager.getPreferences();
      expect(preferences.enableAutoSync).toBe(false);
      expect(preferences.syncInterval).toBe(60);
    });

    it('should notify listeners on preference changes', () => {
      const listener = vi.fn();
      preferencesManager.addPreferenceChangeListener(listener);
      
      preferencesManager.updatePreferences({ enableAutoSync: true });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ enableAutoSync: true })
      );
      
      preferencesManager.removePreferenceChangeListener(listener);
      preferencesManager.updatePreferences({ syncInterval: 30 });
      
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called after removal
    });
  });

  describe('Account Preferences', () => {
    it('should update account preferences', () => {
      const accountPreference: AccountSyncPreference = {
        accountId: 'account1',
        accountName: 'Test Account',
        enabled: true,
        priority: 8,
        syncInterval: 45,
      };
      
      preferencesManager.updateAccountPreference('account1', accountPreference);
      
      const retrieved = preferencesManager.getAccountPreference('account1');
      expect(retrieved).toEqual(accountPreference);
      
      const allPreferences = preferencesManager.getAccountPreferences();
      expect(allPreferences['account1']).toEqual(accountPreference);
    });

    it('should remove account preferences', () => {
      preferencesManager.updateAccountPreference('account1', {
        accountId: 'account1',
        accountName: 'Test Account',
        enabled: true,
        priority: 5,
      });
      
      preferencesManager.updateSelectedAccounts(['account1']);
      
      preferencesManager.removeAccountPreference('account1');
      
      expect(preferencesManager.getAccountPreference('account1')).toBeUndefined();
      expect(preferencesManager.getPreferences().selectedAccounts).not.toContain('account1');
    });

    it('should manage selected accounts', () => {
      preferencesManager.addSelectedAccount('account1');
      preferencesManager.addSelectedAccount('account2');
      
      expect(preferencesManager.isAccountSelected('account1')).toBe(true);
      expect(preferencesManager.isAccountSelected('account2')).toBe(true);
      expect(preferencesManager.getPreferences().selectedAccounts).toEqual(['account1', 'account2']);
      
      preferencesManager.removeSelectedAccount('account1');
      
      expect(preferencesManager.isAccountSelected('account1')).toBe(false);
      expect(preferencesManager.getPreferences().selectedAccounts).toEqual(['account2']);
      
      preferencesManager.updateSelectedAccounts(['account3', 'account4']);
      
      expect(preferencesManager.getPreferences().selectedAccounts).toEqual(['account3', 'account4']);
    });

    it('should not add duplicate selected accounts', () => {
      preferencesManager.addSelectedAccount('account1');
      preferencesManager.addSelectedAccount('account1'); // Duplicate
      
      expect(preferencesManager.getPreferences().selectedAccounts).toEqual(['account1']);
    });
  });

  describe('Notifications', () => {
    it('should add notifications', () => {
      const notificationId = preferencesManager.addNotification({
        type: 'success',
        title: 'Sync Complete',
        message: 'Facebook data synchronized successfully',
        persistent: false,
      });
      
      expect(notificationId).toBeDefined();
      
      const notifications = preferencesManager.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Sync Complete');
      expect(notifications[0].read).toBe(false);
    });

    it('should manage notification read status', () => {
      const notificationId = preferencesManager.addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: 'Failed to sync Facebook data',
        persistent: true,
      });
      
      expect(preferencesManager.getUnreadNotificationCount()).toBe(1);
      
      preferencesManager.markNotificationRead(notificationId);
      
      expect(preferencesManager.getUnreadNotificationCount()).toBe(0);
      
      const notifications = preferencesManager.getNotifications();
      expect(notifications[0].read).toBe(true);
    });

    it('should filter unread notifications', () => {
      const id1 = preferencesManager.addNotification({
        type: 'info',
        title: 'Info 1',
        message: 'Message 1',
        persistent: false,
      });
      
      const id2 = preferencesManager.addNotification({
        type: 'info',
        title: 'Info 2',
        message: 'Message 2',
        persistent: false,
      });
      
      preferencesManager.markNotificationRead(id1);
      
      const unreadNotifications = preferencesManager.getNotifications(true);
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].title).toBe('Info 2');
    });

    it('should remove notifications', () => {
      const notificationId = preferencesManager.addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Test warning',
        persistent: false,
      });
      
      preferencesManager.removeNotification(notificationId);
      
      const notifications = preferencesManager.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      preferencesManager.addNotification({
        type: 'info',
        title: 'Info 1',
        message: 'Message 1',
        persistent: false,
      });
      
      preferencesManager.addNotification({
        type: 'info',
        title: 'Info 2',
        message: 'Message 2',
        persistent: false,
      });
      
      preferencesManager.clearNotifications();
      
      const notifications = preferencesManager.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should mark all notifications as read', () => {
      preferencesManager.addNotification({
        type: 'info',
        title: 'Info 1',
        message: 'Message 1',
        persistent: false,
      });
      
      preferencesManager.addNotification({
        type: 'info',
        title: 'Info 2',
        message: 'Message 2',
        persistent: false,
      });
      
      expect(preferencesManager.getUnreadNotificationCount()).toBe(2);
      
      preferencesManager.markAllNotificationsRead();
      
      expect(preferencesManager.getUnreadNotificationCount()).toBe(0);
    });
  });

  describe('Configuration Generation', () => {
    it('should generate sync configuration for scheduler', () => {
      preferencesManager.updatePreferences({
        syncInterval: 45,
        maxRetries: 5,
        retryDelay: 3000,
        enableAutoSync: true,
        syncOnStartup: true,
        maxConcurrentSyncs: 3,
      });
      
      const config = preferencesManager.getSyncConfiguration();
      
      expect(config).toEqual({
        defaultInterval: 45,
        maxRetries: 5,
        retryDelay: 3000,
        enableAutoSync: true,
        syncOnStartup: true,
        maxConcurrentSyncs: 3,
      });
    });

    it('should generate sync options for API service', () => {
      preferencesManager.updatePreferences({
        includeInsights: false,
        campaignStatus: ['ACTIVE'],
        dateRangeType: 'last_7_days',
      });
      
      const options = preferencesManager.getSyncOptions();
      
      expect(options.includeInsights).toBe(false);
      expect(options.campaignStatus).toEqual(['ACTIVE']);
      expect(options.dateRange).toBeDefined();
      expect(options.dateRange?.since).toBeDefined();
      expect(options.dateRange?.until).toBeDefined();
    });

    it('should handle custom date range', () => {
      preferencesManager.updatePreferences({
        dateRangeType: 'custom',
        customDateRange: {
          since: '2024-01-01',
          until: '2024-01-31',
        },
      });
      
      const options = preferencesManager.getSyncOptions();
      
      expect(options.dateRange).toEqual({
        since: '2024-01-01',
        until: '2024-01-31',
      });
    });
  });

  describe('Import/Export', () => {
    it('should export preferences', () => {
      preferencesManager.updatePreferences({
        enableAutoSync: true,
        syncInterval: 30,
      });
      
      const exported = preferencesManager.exportPreferences();
      const parsed = JSON.parse(exported);
      
      expect(parsed.preferences.enableAutoSync).toBe(true);
      expect(parsed.preferences.syncInterval).toBe(30);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBe('1.0');
    });

    it('should import preferences', () => {
      const importData = JSON.stringify({
        preferences: {
          enableAutoSync: true,
          syncInterval: 90,
          selectedAccounts: ['imported_account'],
        },
        version: '1.0',
      });
      
      const success = preferencesManager.importPreferences(importData);
      
      expect(success).toBe(true);
      
      const preferences = preferencesManager.getPreferences();
      expect(preferences.enableAutoSync).toBe(true);
      expect(preferences.syncInterval).toBe(90);
      expect(preferences.selectedAccounts).toEqual(['imported_account']);
    });

    it('should handle invalid import data', () => {
      const success = preferencesManager.importPreferences('invalid json');
      
      expect(success).toBe(false);
      
      // Preferences should remain unchanged
      const preferences = preferencesManager.getPreferences();
      expect(preferences.enableAutoSync).toBe(false); // Default value
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old notifications when enabled', () => {
      preferencesManager.updatePreferences({ autoCleanupHistory: true });
      
      // Add old notification (simulate by mocking timestamp)
      const oldNotificationId = preferencesManager.addNotification({
        type: 'info',
        title: 'Old Notification',
        message: 'This is old',
        persistent: false,
      });
      
      // Add recent notification
      const recentNotificationId = preferencesManager.addNotification({
        type: 'info',
        title: 'Recent Notification',
        message: 'This is recent',
        persistent: false,
      });
      
      // Add persistent notification
      const persistentNotificationId = preferencesManager.addNotification({
        type: 'info',
        title: 'Persistent Notification',
        message: 'This is persistent',
        persistent: true,
      });
      
      // Mock old timestamp for first notification
      const notifications = preferencesManager.getNotifications();
      const oldNotification = notifications.find(n => n.id === oldNotificationId);
      if (oldNotification) {
        oldNotification.timestamp = new Date(Date.now() - (35 * 24 * 60 * 60 * 1000)); // 35 days ago
      }
      
      preferencesManager.cleanup();
      
      const remainingNotifications = preferencesManager.getNotifications();
      const remainingIds = remainingNotifications.map(n => n.id);
      
      // Old non-persistent notification should be removed
      expect(remainingIds).not.toContain(oldNotificationId);
      // Recent and persistent notifications should remain
      expect(remainingIds).toContain(recentNotificationId);
      expect(remainingIds).toContain(persistentNotificationId);
    });
  });

  describe('Singleton Factory', () => {
    it('should return same instance from factory', () => {
      const preferences1 = getFacebookSyncPreferences();
      const preferences2 = getFacebookSyncPreferences();
      
      expect(preferences1).toBe(preferences2);
      
      resetFacebookSyncPreferences();
    });

    it('should create new instance after reset', () => {
      const preferences1 = getFacebookSyncPreferences();
      resetFacebookSyncPreferences();
      const preferences2 = getFacebookSyncPreferences();
      
      expect(preferences1).not.toBe(preferences2);
      
      resetFacebookSyncPreferences();
    });
  });
});