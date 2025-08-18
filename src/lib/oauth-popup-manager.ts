/**
 * OAuth Popup Manager
 * Handles popup window management for OAuth authentication flows
 */

export interface OAuthPopupConfig {
  width?: number;
  height?: number;
  timeout?: number; // milliseconds
}

export interface OAuthPopupManager {
  openPopup(authUrl: string, config?: OAuthPopupConfig): Promise<string>;
  closePopup(): void;
  handleMessage(event: MessageEvent): void;
}

export class FacebookOAuthPopupManager implements OAuthPopupManager {
  private popup: Window | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private resolvePromise: ((value: string) => void) | null = null;
  private rejectPromise: ((reason: any) => void) | null = null;

  private readonly defaultConfig: Required<OAuthPopupConfig> = {
    width: 500,
    height: 600,
    timeout: 300000, // 5 minutes
  };

  /**
   * Opens a popup window for OAuth authentication
   * @param authUrl The Facebook OAuth authorization URL
   * @param config Optional configuration for popup dimensions and timeout
   * @returns Promise that resolves with the authorization code
   */
  async openPopup(authUrl: string, config?: OAuthPopupConfig): Promise<string> {
    if (this.popup && !this.popup.closed) {
      this.closePopup();
    }

    const finalConfig = { ...this.defaultConfig, ...config };

    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      try {
        // Calculate popup position (center of screen)
        const left = Math.round(window.screen.width / 2 - finalConfig.width / 2);
        const top = Math.round(window.screen.height / 2 - finalConfig.height / 2);

        const popupFeatures = [
          `width=${finalConfig.width}`,
          `height=${finalConfig.height}`,
          `left=${left}`,
          `top=${top}`,
          'scrollbars=yes',
          'resizable=yes',
          'status=no',
          'toolbar=no',
          'menubar=no',
          'location=no',
        ].join(',');

        // Open popup window
        this.popup = window.open(authUrl, 'facebook_oauth', popupFeatures);

        if (!this.popup) {
          throw new Error('Failed to open popup window. Please check if popups are blocked.');
        }

        // Set up message listener for cross-origin communication
        this.setupMessageListener();

        // Set up timeout
        this.setupTimeout(finalConfig.timeout);

        // Monitor popup closure
        this.monitorPopupClosure();

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Closes the popup window and cleans up resources
   */
  closePopup(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.cleanup();
  }

  /**
   * Handles messages from the popup window
   * @param event MessageEvent from the popup
   */
  handleMessage(event: MessageEvent): void {
    console.log('Popup manager received message:', {
      origin: event.origin,
      dataType: event.data?.type,
      hasCode: !!event.data?.code,
      hasError: !!event.data?.error
    });

    // Verify origin for security
    if (!this.isValidOrigin(event.origin)) {
      console.warn('Received message from invalid origin:', event.origin);
      return;
    }

    const { data } = event;

    if (data && typeof data === 'object') {
      if (data.type === 'FACEBOOK_OAUTH_SUCCESS' && data.code) {
        console.log('OAuth success, code length:', data.code.length);
        this.handleSuccess(data.code);
      } else if (data.type === 'FACEBOOK_OAUTH_ERROR') {
        console.error('OAuth error:', data.error);
        this.handleError(new Error(data.error || 'OAuth authentication failed'));
      } else if (data.type === 'FACEBOOK_OAUTH_CANCELLED') {
        console.log('OAuth cancelled by user');
        this.handleError(new Error('OAuth authentication was cancelled by user'));
      } else {
        console.warn('Unknown message type or missing data:', data);
      }
    } else {
      console.warn('Invalid message data:', data);
    }
  }

  /**
   * Sets up the message listener for cross-origin communication
   */
  private setupMessageListener(): void {
    this.messageListener = (event: MessageEvent) => this.handleMessage(event);
    window.addEventListener('message', this.messageListener);
  }

  /**
   * Sets up timeout for the OAuth flow
   */
  private setupTimeout(timeout: number): void {
    this.timeoutId = setTimeout(() => {
      this.handleError(new Error('OAuth authentication timed out'));
    }, timeout);
  }

  /**
   * Monitors popup window closure
   */
  private monitorPopupClosure(): void {
    const checkClosed = () => {
      if (this.popup && this.popup.closed) {
        this.handleError(new Error('OAuth popup was closed before completion'));
        return;
      }
      
      if (this.popup && !this.popup.closed) {
        setTimeout(checkClosed, 1000);
      }
    };

    setTimeout(checkClosed, 1000);
  }

  /**
   * Validates the origin of received messages
   */
  private isValidOrigin(origin: string): boolean {
    const validOrigins = [
      'https://www.facebook.com',
      'https://facebook.com',
      'https://m.facebook.com',
      window.location.origin, // Allow same-origin for callback page
    ];

    return validOrigins.includes(origin);
  }

  /**
   * Handles successful OAuth completion
   */
  private handleSuccess(code: string): void {
    if (this.resolvePromise) {
      this.resolvePromise(code);
    }
    this.cleanup();
  }

  /**
   * Handles OAuth errors
   */
  private handleError(error: Error): void {
    if (this.rejectPromise) {
      this.rejectPromise(error);
    }
    this.cleanup();
  }

  /**
   * Cleans up resources and event listeners
   */
  private cleanup(): void {
    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Remove message listener
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    // Close popup if still open
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.popup = null;

    // Clear promise references
    this.resolvePromise = null;
    this.rejectPromise = null;
  }
}

/**
 * Utility function to create a Facebook OAuth popup manager instance
 */
export function createFacebookOAuthPopupManager(): FacebookOAuthPopupManager {
  return new FacebookOAuthPopupManager();
}