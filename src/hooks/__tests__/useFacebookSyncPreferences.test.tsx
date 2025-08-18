// Tests for useFacebookSyncPreferences hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useFacebookSyncPreferences, 
  useFacebookSyncNotifications,
  useFacebookAccountSelection 
} from '../useFacebookSyncPreferences';
import { resetFacebookSyncPreferences } from '@/lib/facebook-sync-preferences';

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

describe('useFacebookSyncPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    resetFacebookSyncPreferences();
  });

  afterEach(() => {
    resetFacebookSyncPreferences();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default preferences', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      expect(result.current.preferences.enableAutoSync).toBe(false);
      expect(result.current.preferences.syncInterval).toBe(60);
      expect(result.current.selectedAccounts).toEqual([]);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should update preferences', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      act(() => {
        result.current.updatePreferences({
          enableAutoSync: true,
          syncInterval: 30,
        });
      });

      expect(result.current.preferences.enableAutoSync).toBe(true);
      expect(result.current.preferences.syncInterval).toBe(30);
    });

    it('should reset preferences', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      // First update preferences
      act(() => {
        result.current.updatePreferences({
          enableAutoSync: true,
          syncInterval: 120,
        });
      });

      expect(result.current.preferences.enableAutoSync).toBe(true);

      // Then reset
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences.enableAutoSync).toBe(false);
      expect(result.current.preferences.syncInterval).toBe(60);
    });
  });

  describe('Account Management', () => {
    it('should manage selected accounts', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      // Add account
      act(() => {
        result.current.addSelectedAccount('account1');
      });

      expect(result.current.selectedAccounts).toContain('account1');
      expect(result.current.isAccountSelected('account1')).toBe(true);

      // Add another account
      act(() => {
        result.current.addSelectedAccount('account2');
      });

      expect(result.current.selectedAccounts).toEqual(['account1', 'account2']);

      // Remove account
      act(() => {
        result.current.removeSelectedAccount('account1');
      });

      expect(result.current.selectedAccounts).toEqual(['account2']);
      expect(result.current.isAccountSelected('account1')).toBe(false);

      // Update all accounts
      act(() => {
        result.current.updateSelectedAccounts(['account3', 'account4']);
      });

      expect(result.current.selectedAccounts).toEqual(['account3', 'account4']);
    });

    it('should manage account preferences', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      const accountPreference = {
        accountId: 'account1',
        accountName: 'Test Account',
        enabled: true,
        priority: 8,
        syncInterval: 45,
      };

      act(() => {
        result.current.updateAccountPreference('account1', accountPreference);
      });

      expect(result.current.accountPreferences['account1']).toEqual(accountPreference);

      // Remove account preference
      act(() => {
        result.current.removeAccountPreference('account1');
      });

      expect(result.current.accountPreferences['account1']).toBeUndefined();
    });
  });

  describe('Notification Management', () => {
    it('should add and manage notifications', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      // Add notification
      let notificationId: string;
      act(() => {
        notificationId = result.current.addNotification({
          type: 'success',
          title: 'Sync Complete',
          message: 'Data synchronized successfully',
          persistent: false,
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      
      // Check notification properties
      const notification = result.current.notifications[0];
      expect(notification.read).toBe(false);
      expect(notification.title).toBe('Sync Complete');
      
      // The unreadCount should be calculated from the notifications
      const unreadNotifications = result.current.notifications.filter(n => !n.read);
      expect(unreadNotifications).toHaveLength(1);

      // Mark as read
      act(() => {
        result.current.markNotificationRead(notificationId!);
      });

      const readNotifications = result.current.notifications.filter(n => n.read);
      expect(readNotifications).toHaveLength(1);

      // Add another notification
      act(() => {
        result.current.addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: 'Failed to sync data',
          persistent: true,
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      // Mark all as read
      act(() => {
        result.current.markAllNotificationsRead();
      });

      const allReadNotifications = result.current.notifications.filter(n => n.read);
      expect(allReadNotifications).toHaveLength(2);

      // Clear all notifications
      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should remove specific notifications', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      let notificationId: string;
      act(() => {
        notificationId = result.current.addNotification({
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
          persistent: false,
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.removeNotification(notificationId!);
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should provide sync configuration', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      act(() => {
        result.current.updatePreferences({
          syncInterval: 45,
          maxRetries: 5,
          enableAutoSync: true,
        });
      });

      const config = result.current.getSyncConfiguration();

      expect(config.defaultInterval).toBe(45);
      expect(config.maxRetries).toBe(5);
      expect(config.enableAutoSync).toBe(true);
    });

    it('should provide sync options', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      act(() => {
        result.current.updatePreferences({
          includeInsights: false,
          campaignStatus: ['ACTIVE'],
          dateRangeType: 'last_7_days',
        });
      });

      const options = result.current.getSyncOptions();

      expect(options.includeInsights).toBe(false);
      expect(options.campaignStatus).toEqual(['ACTIVE']);
      expect(options.dateRange).toBeDefined();
    });
  });

  describe('Import/Export', () => {
    it('should export and import preferences', () => {
      const { result } = renderHook(() => useFacebookSyncPreferences());

      // Update some preferences
      act(() => {
        result.current.updatePreferences({
          enableAutoSync: true,
          syncInterval: 90,
        });
      });

      // Export preferences
      const exported = result.current.exportPreferences();
      expect(exported).toContain('"enableAutoSync": true');
      expect(exported).toContain('"syncInterval": 90');

      // Reset preferences
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences.enableAutoSync).toBe(false);

      // Import preferences
      let importSuccess: boolean;
      act(() => {
        importSuccess = result.current.importPreferences(exported);
      });

      expect(importSuccess!).toBe(true);
      expect(result.current.preferences.enableAutoSync).toBe(true);
      expect(result.current.preferences.syncInterval).toBe(90);
    });
  });
});

describe('useFacebookSyncNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    resetFacebookSyncPreferences();
  });

  afterEach(() => {
    resetFacebookSyncPreferences();
  });

  it('should provide notification helpers', () => {
    const { result } = renderHook(() => useFacebookSyncNotifications());

    // Test success notification
    act(() => {
      result.current.notifySuccess('Success', 'Operation completed', 'job1');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].title).toBe('Success');

    // Test error notification
    act(() => {
      result.current.notifyError('Error', 'Operation failed', 'job2');
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].type).toBe('error'); // Most recent first

    // Test warning notification
    act(() => {
      result.current.notifyWarning('Warning', 'Quota warning');
    });

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications[0].type).toBe('warning');

    // Test info notification
    act(() => {
      result.current.notifyInfo('Info', 'Information message');
    });

    expect(result.current.notifications).toHaveLength(4);
    expect(result.current.notifications[0].type).toBe('info');
  });
});

describe('useFacebookAccountSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    resetFacebookSyncPreferences();
  });

  afterEach(() => {
    resetFacebookSyncPreferences();
  });

  it('should manage account selection', () => {
    const { result } = renderHook(() => useFacebookAccountSelection());

    // Toggle account selection
    act(() => {
      result.current.toggleAccountSelection('account1');
    });

    expect(result.current.selectedAccounts).toContain('account1');
    expect(result.current.isAccountSelected('account1')).toBe(true);

    // Toggle again to deselect
    act(() => {
      result.current.toggleAccountSelection('account1');
    });

    expect(result.current.selectedAccounts).not.toContain('account1');
    expect(result.current.isAccountSelected('account1')).toBe(false);

    // Select all accounts
    act(() => {
      result.current.selectAllAccounts(['account1', 'account2', 'account3']);
    });

    expect(result.current.selectedAccounts).toEqual(['account1', 'account2', 'account3']);

    // Clear all selections
    act(() => {
      result.current.clearAllSelections();
    });

    expect(result.current.selectedAccounts).toEqual([]);
  });

  it('should manage account preferences', () => {
    const { result } = renderHook(() => useFacebookAccountSelection());

    // Get default account preference
    const defaultPreference = result.current.getAccountPreference('account1');
    expect(defaultPreference.accountId).toBe('account1');
    expect(defaultPreference.enabled).toBe(true);
    expect(defaultPreference.priority).toBe(5);

    // Update account priority
    act(() => {
      result.current.updateAccountPriority('account1', 8);
    });

    const updatedPreference = result.current.getAccountPreference('account1');
    expect(updatedPreference.priority).toBe(8);

    // Toggle account enabled status
    act(() => {
      result.current.toggleAccountEnabled('account1');
    });

    const disabledPreference = result.current.getAccountPreference('account1');
    expect(disabledPreference.enabled).toBe(false);

    // Toggle again to enable
    act(() => {
      result.current.toggleAccountEnabled('account1');
    });

    const enabledPreference = result.current.getAccountPreference('account1');
    expect(enabledPreference.enabled).toBe(true);
  });

  it('should update account preferences', () => {
    const { result } = renderHook(() => useFacebookAccountSelection());

    act(() => {
      result.current.updateAccountPreference('account1', {
        accountName: 'Test Account',
        priority: 9,
        syncInterval: 30,
      });
    });

    const preference = result.current.getAccountPreference('account1');
    expect(preference.accountName).toBe('Test Account');
    expect(preference.priority).toBe(9);
    expect(preference.syncInterval).toBe(30);

    // Remove account preference
    act(() => {
      result.current.removeAccountPreference('account1');
    });

    const removedPreference = result.current.getAccountPreference('account1');
    expect(removedPreference.accountName).toBe(''); // Back to default
    expect(removedPreference.priority).toBe(5); // Back to default
  });
});