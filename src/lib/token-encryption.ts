/**
 * Token Encryption Service
 * Provides secure encryption/decryption for OAuth tokens in localStorage
 */

export interface TokenEncryptionService {
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  generateKey(): Promise<CryptoKey>;
  clearKey(): void;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export class TokenEncryptionServiceImpl implements TokenEncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly ivLength = 12; // 96 bits for AES-GCM
  private readonly saltLength = 16; // 128 bits
  private readonly iterations = 100000; // PBKDF2 iterations
  private cryptoKey: CryptoKey | null = null;
  private readonly keyStorageKey = 'fb_token_key_material';

  /**
   * Encrypts data using AES-GCM with a derived key
   */
  async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey();
      
      // Generate random IV and salt
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
      
      // Derive key from master key and salt
      const derivedKey = await this.deriveKey(key, salt);
      
      // Encrypt the data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        derivedKey,
        dataBuffer
      );
      
      // Combine encrypted data with IV and salt
      const encryptedData: EncryptedData = {
        data: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
      };
      
      return btoa(JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt token data');
    }
  }

  /**
   * Decrypts data using AES-GCM with a derived key
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateKey();
      
      // Parse encrypted data
      const parsedData: EncryptedData = JSON.parse(atob(encryptedData));
      
      // Convert base64 back to ArrayBuffer
      const dataBuffer = this.base64ToArrayBuffer(parsedData.data);
      const iv = this.base64ToArrayBuffer(parsedData.iv);
      const salt = this.base64ToArrayBuffer(parsedData.salt);
      
      // Derive key from master key and salt
      const derivedKey = await this.deriveKey(key, new Uint8Array(salt));
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        derivedKey,
        dataBuffer
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt token data');
    }
  }

  /**
   * Generates a new encryption key
   */
  async generateKey(): Promise<CryptoKey> {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: this.algorithm,
          length: this.keyLength,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      this.cryptoKey = key;
      await this.storeKeyMaterial(key);
      
      return key;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Clears the encryption key from memory and storage
   */
  clearKey(): void {
    this.cryptoKey = null;
    try {
      localStorage.removeItem(this.keyStorageKey);
    } catch (error) {
      console.warn('Failed to clear key material:', error);
    }
  }

  /**
   * Gets existing key or creates a new one
   */
  private async getOrCreateKey(): Promise<CryptoKey> {
    if (this.cryptoKey) {
      return this.cryptoKey;
    }

    try {
      // Try to load existing key
      const storedKey = await this.loadKeyMaterial();
      if (storedKey) {
        this.cryptoKey = storedKey;
        return storedKey;
      }
    } catch (error) {
      console.warn('Failed to load existing key, generating new one:', error);
    }

    // Generate new key if none exists
    return await this.generateKey();
  }

  /**
   * Stores key material in localStorage (encrypted with a device-specific key)
   */
  private async storeKeyMaterial(key: CryptoKey): Promise<void> {
    try {
      // Export the key
      const keyData = await crypto.subtle.exportKey('raw', key);
      
      // Create a device-specific key for protecting the stored key
      const deviceKey = await this.getDeviceKey();
      
      // Encrypt the key data
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      const encryptedKeyData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        deviceKey,
        keyData
      );
      
      // Store encrypted key with IV
      const storedData = {
        key: this.arrayBufferToBase64(encryptedKeyData),
        iv: this.arrayBufferToBase64(iv),
      };
      
      localStorage.setItem(this.keyStorageKey, btoa(JSON.stringify(storedData)));
    } catch (error) {
      console.error('Failed to store key material:', error);
      throw new Error('Failed to store encryption key');
    }
  }

  /**
   * Loads key material from localStorage
   */
  private async loadKeyMaterial(): Promise<CryptoKey | null> {
    try {
      const storedData = localStorage.getItem(this.keyStorageKey);
      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(atob(storedData));
      
      // Get device key
      const deviceKey = await this.getDeviceKey();
      
      // Decrypt the key data
      const keyBuffer = this.base64ToArrayBuffer(parsedData.key);
      const iv = this.base64ToArrayBuffer(parsedData.iv);
      
      const decryptedKeyData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        deviceKey,
        keyBuffer
      );
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        decryptedKeyData,
        {
          name: this.algorithm,
          length: this.keyLength,
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      return key;
    } catch (error) {
      console.warn('Failed to load key material:', error);
      return null;
    }
  }

  /**
   * Creates a device-specific key for protecting stored keys
   */
  private async getDeviceKey(): Promise<CryptoKey> {
    // Create a device-specific seed from available browser information
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width.toString(),
      screen.height.toString(),
      new Date().getTimezoneOffset().toString(),
    ].join('|');
    
    // Hash the device info to create a consistent seed
    const encoder = new TextEncoder();
    const deviceSeed = await crypto.subtle.digest('SHA-256', encoder.encode(deviceInfo));
    
    // Derive a key from the device seed
    const deviceKey = await crypto.subtle.importKey(
      'raw',
      deviceSeed,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Use a fixed salt for device key derivation (this is acceptable since it's device-specific)
    const salt = new TextEncoder().encode('facebook-oauth-device-key-salt-v1');
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256',
      },
      deviceKey,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derives a key from master key and salt using PBKDF2
   */
  private async deriveKey(masterKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    // First, export the master key to use with PBKDF2
    const keyMaterial = await crypto.subtle.exportKey('raw', masterKey);
    
    // Import as PBKDF2 key
    const pbkdf2Key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive the final key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256',
      },
      pbkdf2Key,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Factory function to create token encryption service
 */
export function createTokenEncryptionService(): TokenEncryptionService {
  return new TokenEncryptionServiceImpl();
}

/**
 * Singleton instance for global use
 */
let tokenEncryptionServiceInstance: TokenEncryptionService | null = null;

export function getTokenEncryptionService(): TokenEncryptionService {
  if (!tokenEncryptionServiceInstance) {
    tokenEncryptionServiceInstance = createTokenEncryptionService();
  }
  return tokenEncryptionServiceInstance;
}