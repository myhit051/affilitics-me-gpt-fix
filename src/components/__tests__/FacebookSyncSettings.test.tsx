import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FacebookSyncSettings from '../FacebookSyncSettings';

// Mock the Facebook sync preferences hook
vi.mock('@/hooks/useFacebookSyncPreferences', () => ({
  useFacebookSyncPreferences: () => ({
    preferences: {
      enableAutoSync: false,
      syncInterval: 60,
      selectedAccounts: [],
      syncOnStartup: false,
      notifyOnSync: true,
      retryFailedSync: true,
      maxRetryAttempts: 3,
    },
    updatePreferences: vi.fn(),
    resetPreferences: vi.fn(),
    addSelectedAccount: vi.fn(),
    removeSelectedAccount: vi.fn(),
    isAccountSelected: vi.fn().mockReturnValue(false),
  }),
  useFacebookSyncNotifications: () => ({
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
  }),
}));

// Mock the Facebook API service
vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => ({
    getAdAccounts: vi.fn().mockResolvedValue([
      { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
      { id: 'act_456', name: 'Test Account 2', currency: 'EUR' },
    ]),
  }),
}));

describe('FacebookSyncSettings', () => {
  const mockOnSettingsChange = vi.fn();

  const defaultProps = {
    onSettingsChange: mockOnSettingsChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders sync settings form', () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      expect(screen.getByText('Sync Settings')).toBeInTheDocument();
      expect(screen.getByLabelText(/enable automatic sync/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sync interval/i)).toBeInTheDocument();
    });

    it('displays current preference values', () => {
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: true,
          syncInterval: 120,
          selectedAccounts: ['act_123'],
          syncOnStartup: true,
          notifyOnSync: false,
          retryFailedSync: true,
          maxRetryAttempts: 5,
        },
        updatePreferences: vi.fn(),
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(true),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const autoSyncCheckbox = screen.getByLabelText(/enable automatic sync/i) as HTMLInputElement;
      expect(autoSyncCheckbox.checked).toBe(true);

      const syncIntervalInput = screen.getByLabelText(/sync interval/i) as HTMLInputElement;
      expect(syncIntervalInput.value).toBe('120');
    });
  });

  describe('Auto Sync Settings', () => {
    it('toggles auto sync setting', async () => {
      const mockUpdatePreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: mockUpdatePreferences,
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const autoSyncCheckbox = screen.getByLabelText(/enable automatic sync/i);
      fireEvent.click(autoSyncCheckbox);

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          enableAutoSync: true,
        });
      });
    });

    it('updates sync interval', async () => {
      const mockUpdatePreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: true,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: mockUpdatePreferences,
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const syncIntervalInput = screen.getByLabelText(/sync interval/i);
      fireEvent.change(syncIntervalInput, { target: { value: '180' } });

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          syncInterval: 180,
        });
      });
    });

    it('validates sync interval input', async () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      const syncIntervalInput = screen.getByLabelText(/sync interval/i);
      fireEvent.change(syncIntervalInput, { target: { value: '0' } });

      await waitFor(() => {
        expect(screen.getByText(/sync interval must be at least 1 minute/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Selection', () => {
    it('displays available accounts for selection', async () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Account 1')).toBeInTheDocument();
        expect(screen.getByText('Test Account 2')).toBeInTheDocument();
      });
    });

    it('handles account selection', async () => {
      const mockAddSelectedAccount = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: vi.fn(),
        resetPreferences: vi.fn(),
        addSelectedAccount: mockAddSelectedAccount,
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      await waitFor(() => {
        const accountCheckbox = screen.getByLabelText(/test account 1/i);
        fireEvent.click(accountCheckbox);

        expect(mockAddSelectedAccount).toHaveBeenCalledWith('act_123');
      });
    });

    it('handles account deselection', async () => {
      const mockRemoveSelectedAccount = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: ['act_123'],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: vi.fn(),
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: mockRemoveSelectedAccount,
        isAccountSelected: vi.fn().mockReturnValue(true),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      await waitFor(() => {
        const accountCheckbox = screen.getByLabelText(/test account 1/i);
        fireEvent.click(accountCheckbox);

        expect(mockRemoveSelectedAccount).toHaveBeenCalledWith('act_123');
      });
    });
  });

  describe('Notification Settings', () => {
    it('toggles notification settings', async () => {
      const mockUpdatePreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: false,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: mockUpdatePreferences,
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const notifyCheckbox = screen.getByLabelText(/notify on sync completion/i);
      fireEvent.click(notifyCheckbox);

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          notifyOnSync: true,
        });
      });
    });
  });

  describe('Retry Settings', () => {
    it('toggles retry failed sync setting', async () => {
      const mockUpdatePreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: false,
          maxRetryAttempts: 3,
        },
        updatePreferences: mockUpdatePreferences,
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const retryCheckbox = screen.getByLabelText(/retry failed syncs/i);
      fireEvent.click(retryCheckbox);

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          retryFailedSync: true,
        });
      });
    });

    it('updates max retry attempts', async () => {
      const mockUpdatePreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: false,
          syncInterval: 60,
          selectedAccounts: [],
          syncOnStartup: false,
          notifyOnSync: true,
          retryFailedSync: true,
          maxRetryAttempts: 3,
        },
        updatePreferences: mockUpdatePreferences,
        resetPreferences: vi.fn(),
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(false),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const maxRetriesInput = screen.getByLabelText(/max retry attempts/i);
      fireEvent.change(maxRetriesInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockUpdatePreferences).toHaveBeenCalledWith({
          maxRetryAttempts: 5,
        });
      });
    });
  });

  describe('Settings Reset', () => {
    it('resets settings to defaults', async () => {
      const mockResetPreferences = vi.fn();
      const mockUseFacebookSyncPreferences = vi.fn(() => ({
        preferences: {
          enableAutoSync: true,
          syncInterval: 120,
          selectedAccounts: ['act_123'],
          syncOnStartup: true,
          notifyOnSync: false,
          retryFailedSync: false,
          maxRetryAttempts: 5,
        },
        updatePreferences: vi.fn(),
        resetPreferences: mockResetPreferences,
        addSelectedAccount: vi.fn(),
        removeSelectedAccount: vi.fn(),
        isAccountSelected: vi.fn().mockReturnValue(true),
      }));

      vi.mocked(require('@/hooks/useFacebookSyncPreferences').useFacebookSyncPreferences)
        .mockImplementation(mockUseFacebookSyncPreferences);

      render(<FacebookSyncSettings {...defaultProps} />);

      const resetButton = screen.getByText(/reset to defaults/i);
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockResetPreferences).toHaveBeenCalled();
      });
    });

    it('shows confirmation dialog before reset', async () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      const resetButton = screen.getByText(/reset to defaults/i);
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to reset/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles account loading errors', async () => {
      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        getAdAccounts: vi.fn().mockRejectedValue(new Error('Failed to load accounts')),
      });

      render(<FacebookSyncSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load accounts/i)).toBeInTheDocument();
      });
    });

    it('provides retry option for failed account loading', async () => {
      const mockGetAdAccounts = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to load accounts'))
        .mockResolvedValueOnce([
          { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
        ]);

      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        getAdAccounts: mockGetAdAccounts,
      });

      render(<FacebookSyncSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load accounts/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Account 1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      expect(screen.getByLabelText(/enable automatic sync/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sync interval/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notify on sync completion/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      const autoSyncCheckbox = screen.getByLabelText(/enable automatic sync/i);
      autoSyncCheckbox.focus();
      expect(document.activeElement).toBe(autoSyncCheckbox);
    });

    it('has proper ARIA attributes', () => {
      render(<FacebookSyncSettings {...defaultProps} />);

      const syncIntervalInput = screen.getByLabelText(/sync interval/i);
      expect(syncIntervalInput).toHaveAttribute('aria-describedby');
    });
  });
});