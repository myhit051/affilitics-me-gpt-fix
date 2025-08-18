// React hook for Facebook sync preferences management

import { useState, useEffect, useCallback } from 'react';
import { 
  getFacebookSyncPreferences, 
  SyncPreferences, 
  AccountSyncPreference, 
  SyncNotification,
  FacebookSyncPreferencesManager 
} from '@/lib/facebook-sync-preferences';

export interface UseFacebookSyncPreferencesReturn {
  // Preferences
  preferences: SyncPreferences;
  updatePreferences: (updates: Partial<SyncPreferences>) => void;
  resetPreferences: () => void;
  
  // Account management
  accountPreferences: Record<string, AccountSyncPreference>;
  updateAccountPreference: (accountId: string, preference: Partial<AccountSyncPreference>) => void;
  removeAccountPreference: (accountId: string) => void;
  
  // Selected accounts
  selectedAccounts: string[];
  updateSelectedAccounts: (accountIds: string[]) => void;
  addSelectedAccount: (accountId: string) => void;
  removeSelectedAccount: (accountId: string) => void;
  isAccountSelected: (accountId: string) => boolean;
  
  // Notifications
  notifications: SyncNotification[];
  unreadNotifications: SyncNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<SyncNotification, 'id' | 'timestamp' | 'read'>) => string;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Configuration
  getSyncConfiguration: () => ReturnType<FacebookSyncPreferencesManager['getSyncConfiguration']>;
  getSyncOptions: () => ReturnType<FacebookSyncPreferencesManager['getSyncOptions']>;
  
  // Import/Export
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
  
  // Loading state
  isLoading: boolean;
}

export function useFacebookSyncPreferences(): UseFacebookSyncPreferencesReturn {
  const [preferencesManager] = useState(() => getFacebookSyncPreferences());
  const [preferences, setPreferences] = useState<SyncPreferences>(() => 
    preferencesManager.getPreferences()
  );
  const [notifications, setNotifications] = useState<SyncNotification[]>(() => 
    preferencesManager.getNotifications()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when preferences change
  useEffect(() => {
    const handlePreferenceChange = (newPreferences: SyncPreferences) => {
      setPreferences(newPreferences);
    };

    preferencesManager.addPreferenceChangeListener(handlePreferenceChange);

    return () => {
      preferencesManager.removePreferenceChangeListener(handlePreferenceChange);
    };
  }, [preferencesManager]);

  // Refresh notifications periodically
  useEffect(() => {
    const refreshNotifications = () => {
      setNotifications(preferencesManager.getNotifications());
    };

    // Initial load
    refreshNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);

    return () => clearInterval(interval);
  }, [preferencesManager]);

  // Preference management
  const updatePreferences = useCallback((updates: Partial<SyncPreferences>) => {
    setIsLoading(true);
    try {
      preferencesManager.updatePreferences(updates);
    } finally {
      setIsLoading(false);
    }
  }, [preferencesManager]);

  const resetPreferences = useCallback(() => {
    setIsLoading(true);
    try {
      preferencesManager.resetPreferences();
    } finally {
      setIsLoading(false);
    }
  }, [preferencesManager]);

  // Account preference management
  const accountPreferences = preferences.accountPreferences;

  const updateAccountPreference = useCallback((
    accountId: string, 
    preference: Partial<AccountSyncPreference>
  ) => {
    preferencesManager.updateAccountPreference(accountId, preference);
  }, [preferencesManager]);

  const removeAccountPreference = useCallback((accountId: string) => {
    preferencesManager.removeAccountPreference(accountId);
  }, [preferencesManager]);

  // Selected accounts management
  const selectedAccounts = preferences.selectedAccounts;

  const updateSelectedAccounts = useCallback((accountIds: string[]) => {
    preferencesManager.updateSelectedAccounts(accountIds);
  }, [preferencesManager]);

  const addSelectedAccount = useCallback((accountId: string) => {
    preferencesManager.addSelectedAccount(accountId);
  }, [preferencesManager]);

  const removeSelectedAccount = useCallback((accountId: string) => {
    preferencesManager.removeSelectedAccount(accountId);
  }, [preferencesManager]);

  const isAccountSelected = useCallback((accountId: string) => {
    return preferencesManager.isAccountSelected(accountId);
  }, [preferencesManager]);

  // Notification management
  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const addNotification = useCallback((
    notification: Omit<SyncNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    const id = preferencesManager.addNotification(notification);
    // Force immediate update
    const updatedNotifications = preferencesManager.getNotifications();
    setNotifications(updatedNotifications);
    return id;
  }, [preferencesManager]);

  const markNotificationRead = useCallback((id: string) => {
    preferencesManager.markNotificationRead(id);
    setNotifications(preferencesManager.getNotifications());
  }, [preferencesManager]);

  const markAllNotificationsRead = useCallback(() => {
    preferencesManager.markAllNotificationsRead();
    setNotifications(preferencesManager.getNotifications());
  }, [preferencesManager]);

  const removeNotification = useCallback((id: string) => {
    preferencesManager.removeNotification(id);
    setNotifications(preferencesManager.getNotifications());
  }, [preferencesManager]);

  const clearNotifications = useCallback(() => {
    preferencesManager.clearNotifications();
    setNotifications([]);
  }, [preferencesManager]);

  // Configuration
  const getSyncConfiguration = useCallback(() => {
    return preferencesManager.getSyncConfiguration();
  }, [preferencesManager]);

  const getSyncOptions = useCallback(() => {
    return preferencesManager.getSyncOptions();
  }, [preferencesManager]);

  // Import/Export
  const exportPreferences = useCallback(() => {
    return preferencesManager.exportPreferences();
  }, [preferencesManager]);

  const importPreferences = useCallback((data: string) => {
    setIsLoading(true);
    try {
      const success = preferencesManager.importPreferences(data);
      if (success) {
        setNotifications(preferencesManager.getNotifications());
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  }, [preferencesManager]);

  return {
    // Preferences
    preferences,
    updatePreferences,
    resetPreferences,
    
    // Account management
    accountPreferences,
    updateAccountPreference,
    removeAccountPreference,
    
    // Selected accounts
    selectedAccounts,
    updateSelectedAccounts,
    addSelectedAccount,
    removeSelectedAccount,
    isAccountSelected,
    
    // Notifications
    notifications,
    unreadNotifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    clearNotifications,
    
    // Configuration
    getSyncConfiguration,
    getSyncOptions,
    
    // Import/Export
    exportPreferences,
    importPreferences,
    
    // Loading state
    isLoading,
  };
}

// Hook for sync status notifications
export function useFacebookSyncNotifications() {
  const { 
    notifications, 
    unreadNotifications, 
    unreadCount, 
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    clearNotifications 
  } = useFacebookSyncPreferences();

  // Helper to add different types of notifications
  const notifySuccess = useCallback((title: string, message: string, jobId?: string) => {
    return addNotification({
      type: 'success',
      title,
      message,
      jobId,
      persistent: false,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, jobId?: string) => {
    return addNotification({
      type: 'error',
      title,
      message,
      jobId,
      persistent: true,
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, jobId?: string) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      jobId,
      persistent: true,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, jobId?: string) => {
    return addNotification({
      type: 'info',
      title,
      message,
      jobId,
      persistent: false,
    });
  }, [addNotification]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}

// Hook for account selection management
export function useFacebookAccountSelection() {
  const {
    selectedAccounts,
    accountPreferences,
    updateSelectedAccounts,
    addSelectedAccount,
    removeSelectedAccount,
    isAccountSelected,
    updateAccountPreference,
    removeAccountPreference,
  } = useFacebookSyncPreferences();

  // Toggle account selection
  const toggleAccountSelection = useCallback((accountId: string) => {
    if (isAccountSelected(accountId)) {
      removeSelectedAccount(accountId);
    } else {
      addSelectedAccount(accountId);
    }
  }, [isAccountSelected, addSelectedAccount, removeSelectedAccount]);

  // Select all accounts
  const selectAllAccounts = useCallback((accountIds: string[]) => {
    updateSelectedAccounts(accountIds);
  }, [updateSelectedAccounts]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    updateSelectedAccounts([]);
  }, [updateSelectedAccounts]);

  // Get account preference with defaults
  const getAccountPreference = useCallback((accountId: string): AccountSyncPreference => {
    return accountPreferences[accountId] || {
      accountId,
      accountName: '',
      enabled: true,
      priority: 5,
    };
  }, [accountPreferences]);

  // Update account priority
  const updateAccountPriority = useCallback((accountId: string, priority: number) => {
    updateAccountPreference(accountId, { priority });
  }, [updateAccountPreference]);

  // Enable/disable account
  const toggleAccountEnabled = useCallback((accountId: string) => {
    const current = getAccountPreference(accountId);
    updateAccountPreference(accountId, { enabled: !current.enabled });
  }, [getAccountPreference, updateAccountPreference]);

  return {
    selectedAccounts,
    accountPreferences,
    isAccountSelected,
    toggleAccountSelection,
    selectAllAccounts,
    clearAllSelections,
    getAccountPreference,
    updateAccountPreference,
    removeAccountPreference,
    updateAccountPriority,
    toggleAccountEnabled,
  };
}