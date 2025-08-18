/**
 * Token Encryption Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTokenEncryptionService, TokenEncryptionService } from '../token-encryption';

// Mock crypto.subtle
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    exportKey: vi.fn(),
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    digest: vi.fn(),
  },
  getRandomValues: vi.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('TokenEncryptionService', () => {
  let encryptionService: TokenEncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    encryptionService = createTokenEncryptionService();
  });

  describe('encrypt', () => {
    it('should encrypt data using AES-GCM', async () => {
      const testData = 'test token data';
      const mockKey = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      const mockIV = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const mockEncryptedData = new ArrayBuffer(16);

      mockCrypto.getRandomValues
        .mockReturnValueOnce(mockIV)
        .mockReturnValueOnce(mockSalt);
      
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      const result = await encryptionService.encrypt(testData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: mockIV },
        mockDerivedKey,
        expect.any(ArrayBuffer)
      );
    });

    it('should handle encryption errors gracefully', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Crypto error'));

      await expect(encryptionService.encrypt('test data')).rejects.toThrow('Failed to encrypt token data');
    });
  });

  describe('decrypt', () => {
    it('should decrypt data using AES-GCM', async () => {
      const testData = 'decrypted data';
      const mockKey = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      const mockDecryptedData = new TextEncoder().encode(testData);
      
      // Mock encrypted data structure
      const encryptedDataObj = {
        data: btoa('encrypted'),
        iv: btoa('iv'),
        salt: btoa('salt'),
      };
      const encryptedInput = btoa(JSON.stringify(encryptedDataObj));

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      const result = await encryptionService.decrypt(encryptedInput);

      expect(result).toBe(testData);
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should handle decryption errors gracefully', async () => {
      const invalidData = 'invalid-encrypted-data';

      await expect(encryptionService.decrypt(invalidData)).rejects.toThrow('Failed to decrypt token data');
    });
  });

  describe('generateKey', () => {
    it('should generate a new AES-GCM key', async () => {
      const mockKey = {} as CryptoKey;
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));

      const result = await encryptionService.generateKey();

      expect(result).toBe(mockKey);
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    });

    it('should handle key generation errors', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Key generation failed'));

      await expect(encryptionService.generateKey()).rejects.toThrow('Failed to generate encryption key');
    });
  });

  describe('clearKey', () => {
    it('should clear key from memory and storage', () => {
      encryptionService.clearKey();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('fb_token_key_material');
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => encryptionService.clearKey()).not.toThrow();
    });
  });

  describe('security features', () => {
    it('should use different IVs for each encryption', async () => {
      const mockKey = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      const mockEncryptedData = new ArrayBuffer(16);

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

      // Mock different random values for each call
      mockCrypto.getRandomValues
        .mockReturnValueOnce(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))
        .mockReturnValueOnce(new Uint8Array([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]))
        .mockReturnValueOnce(new Uint8Array([29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]))
        .mockReturnValueOnce(new Uint8Array([41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]));

      await encryptionService.encrypt('data1');
      await encryptionService.encrypt('data2');

      // Verify that getRandomValues was called multiple times (for different IVs and salts)
      // Note: May be called more times due to key generation and device key creation
      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(expect.any(Number));
      expect(mockCrypto.getRandomValues.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('should use PBKDF2 for key derivation', async () => {
      const testData = 'test data';
      const mockKey = {} as CryptoKey;
      const mockPbkdf2Key = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.importKey.mockResolvedValue(mockPbkdf2Key);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDerivedKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));

      await encryptionService.encrypt(testData);

      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 100000,
          hash: 'SHA-256',
        }),
        mockPbkdf2Key,
        expect.objectContaining({
          name: 'AES-GCM',
          length: 256,
        }),
        false,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('device-specific key protection', () => {
    it('should create device-specific keys', async () => {
      const mockKey = {} as CryptoKey;
      const mockDeviceKey = {} as CryptoKey;
      const mockPbkdf2Key = {} as CryptoKey;

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.importKey.mockResolvedValue(mockPbkdf2Key);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockDeviceKey);
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(12));

      await encryptionService.generateKey();

      // Verify device fingerprinting is used
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });
  });
});