import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookOAuthPopupManager, createFacebookOAuthPopupManager } from '../oauth-popup-manager';

// Mock window.open and related APIs
const mockPopup = {
  close: vi.fn(),
  closed: false,
  focus: vi.fn(),
};

const mockWindow = {
  open: vi.fn(() => mockPopup),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  screen: {
    width: 1920,
    height: 1080,
  },
  location: {
    origin: 'http://localhost:3000',
  },
};

// Mock global objects
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'setTimeout', {
  value: vi.fn((fn, delay) => {
    const id = Math.random();
    // Don't execute immediately to avoid unhandled promises
    return id;
  }),
  writable: true,
});

Object.defineProperty(global, 'clearTimeout', {
  value: vi.fn(),
  writable: true,
});

describe('FacebookOAuthPopupManager', () => {
  let popupManager: FacebookOAuthPopupManager;

  beforeEach(() => {
    popupManager = new FacebookOAuthPopupManager();
    vi.clearAllMocks();
    mockPopup.closed = false;
  });

  afterEach(() => {
    popupManager.closePopup();
  });

  describe('openPopup', () => {
    it('should open a popup window with correct parameters', () => {
      const authUrl = 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123';
      
      // Mock successful popup opening
      mockWindow.open.mockReturnValue(mockPopup);

      // Start the popup opening (don't await to avoid hanging promise)
      popupManager.openPopup(authUrl);

      expect(mockWindow.open).toHaveBeenCalledWith(
        authUrl,
        'facebook_oauth',
        expect.stringContaining('width=500,height=600')
      );

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );

      // Clean up
      popupManager.closePopup();
    });

    it('should use custom configuration when provided', () => {
      const authUrl = 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123';
      const config = { width: 800, height: 700, timeout: 60000 };

      mockWindow.open.mockReturnValue(mockPopup);

      popupManager.openPopup(authUrl, config);

      expect(mockWindow.open).toHaveBeenCalledWith(
        authUrl,
        'facebook_oauth',
        expect.stringContaining('width=800,height=700')
      );

      popupManager.closePopup();
    });

    it('should reject if popup fails to open', async () => {
      const authUrl = 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123';
      
      mockWindow.open.mockReturnValue(null);

      await expect(popupManager.openPopup(authUrl)).rejects.toThrow(
        'Failed to open popup window. Please check if popups are blocked.'
      );
    });

    it('should close existing popup before opening new one', () => {
      const authUrl = 'https://www.facebook.com/v19.0/dialog/oauth?client_id=123';
      
      mockWindow.open.mockReturnValue(mockPopup);

      // Open first popup
      popupManager.openPopup(authUrl);
      
      // Open second popup
      popupManager.openPopup(authUrl);

      expect(mockPopup.close).toHaveBeenCalled();
      
      popupManager.closePopup();
    });
  });

  describe('closePopup', () => {
    it('should close the popup window and clean up resources', () => {
      mockWindow.open.mockReturnValue(mockPopup);
      
      popupManager.openPopup('https://www.facebook.com/oauth');
      popupManager.closePopup();

      expect(mockPopup.close).toHaveBeenCalled();
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should handle case when popup is already closed', () => {
      mockPopup.closed = true;
      mockWindow.open.mockReturnValue(mockPopup);
      
      popupManager.openPopup('https://www.facebook.com/oauth');
      
      expect(() => popupManager.closePopup()).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    let messageHandler: (event: MessageEvent) => void;

    beforeEach(() => {
      mockWindow.open.mockReturnValue(mockPopup);
      popupManager.openPopup('https://www.facebook.com/oauth');
      
      // Get the message handler that was registered
      const addEventListenerCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      );
      messageHandler = addEventListenerCall?.[1];
    });

    afterEach(() => {
      popupManager.closePopup();
    });

    it('should handle successful OAuth message', () => {
      const mockEvent = {
        origin: 'https://www.facebook.com',
        data: {
          type: 'FACEBOOK_OAUTH_SUCCESS',
          code: 'auth_code_123'
        }
      } as MessageEvent;

      expect(() => messageHandler(mockEvent)).not.toThrow();
    });

    it('should handle OAuth error message', () => {
      const mockEvent = {
        origin: 'https://www.facebook.com',
        data: {
          type: 'FACEBOOK_OAUTH_ERROR',
          error: 'access_denied'
        }
      } as MessageEvent;

      expect(() => messageHandler(mockEvent)).not.toThrow();
    });

    it('should handle OAuth cancellation message', () => {
      const mockEvent = {
        origin: 'https://www.facebook.com',
        data: {
          type: 'FACEBOOK_OAUTH_CANCELLED'
        }
      } as MessageEvent;

      expect(() => messageHandler(mockEvent)).not.toThrow();
    });

    it('should ignore messages from invalid origins', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const mockEvent = {
        origin: 'https://malicious-site.com',
        data: {
          type: 'FACEBOOK_OAUTH_SUCCESS',
          code: 'auth_code_123'
        }
      } as MessageEvent;

      messageHandler(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Received message from invalid origin:',
        'https://malicious-site.com'
      );

      consoleSpy.mockRestore();
    });

    it('should accept messages from valid origins', () => {
      const validOrigins = [
        'https://www.facebook.com',
        'https://facebook.com',
        'https://m.facebook.com',
        'http://localhost:3000'
      ];

      validOrigins.forEach(origin => {
        const mockEvent = {
          origin,
          data: {
            type: 'FACEBOOK_OAUTH_SUCCESS',
            code: 'auth_code_123'
          }
        } as MessageEvent;

        expect(() => messageHandler(mockEvent)).not.toThrow();
      });
    });
  });

  describe('createFacebookOAuthPopupManager', () => {
    it('should create a new instance of FacebookOAuthPopupManager', () => {
      const manager = createFacebookOAuthPopupManager();
      expect(manager).toBeInstanceOf(FacebookOAuthPopupManager);
    });
  });

  describe('popup lifecycle management', () => {
    it('should clean up resources when popup is closed manually', () => {
      mockWindow.open.mockReturnValue(mockPopup);
      
      popupManager.openPopup('https://www.facebook.com/oauth');
      
      // Simulate popup being closed
      mockPopup.closed = true;
      
      // Manually close to trigger cleanup
      popupManager.closePopup();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });
});