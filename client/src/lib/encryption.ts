import crypto from 'crypto-js';

/**
 * Encryption utility for client communications
 */
export class Encryption {
  private key: string;
  
  constructor(encryptionKey: string) {
    // Hash the key to ensure it's the right length
    this.key = crypto.SHA256(encryptionKey).toString();
  }
  
  /**
   * Encrypt data using AES-256-CBC
   * @param data Data to encrypt
   * @returns Base64 encoded encrypted data
   */
  encrypt(data: string): string {
    try {
      // Generate a random IV
      const iv = crypto.lib.WordArray.random(16);
      
      // Encrypt the data
      const encrypted = crypto.AES.encrypt(data, this.key, {
        iv: iv,
        padding: crypto.pad.Pkcs7,
        mode: crypto.mode.CBC
      });
      
      // Combine IV and encrypted data
      const ivAndEncrypted = iv.concat(encrypted.ciphertext);
      
      // Return as base64
      return crypto.enc.Base64.stringify(ivAndEncrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data that was encrypted using AES-256-CBC
   * @param encryptedData Base64 encoded encrypted data
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string): string {
    try {
      // Decode base64
      const rawData = crypto.enc.Base64.parse(encryptedData);
      
      // Extract IV (first 16 bytes)
      const iv = crypto.lib.WordArray.create(
        rawData.words.slice(0, 4),
        16
      );
      
      // Extract encrypted data (everything after IV)
      const encrypted = crypto.lib.WordArray.create(
        rawData.words.slice(4),
        rawData.sigBytes - 16
      );
      
      // Create cipherParams object
      const cipherParams = crypto.lib.CipherParams.create({
        ciphertext: encrypted
      });
      
      // Decrypt the data
      const decrypted = crypto.AES.decrypt(cipherParams, this.key, {
        iv: iv,
        padding: crypto.pad.Pkcs7,
        mode: crypto.mode.CBC
      });
      
      return decrypted.toString(crypto.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Create singleton instance
let encryptionInstance: Encryption | null = null;

/**
 * Initialize the encryption with a key
 * @param key The encryption key to use
 */
export const initializeEncryption = (key: string): void => {
  encryptionInstance = new Encryption(key);
};

/**
 * Get the encryption instance
 * @returns The encryption instance
 */
export const getEncryption = (): Encryption => {
  if (!encryptionInstance) {
    throw new Error('Encryption not initialized');
  }
  return encryptionInstance;
};
