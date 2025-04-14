import crypto from 'crypto';

/**
 * Encryption utility for server-client communications
 */
export class Encryption {
  private key: Buffer;
  
  constructor(encryptionKey: string) {
    // Convert the key to a SHA-256 hash to ensure it's the right length
    this.key = crypto.createHash('sha256').update(encryptionKey).digest();
  }
  
  /**
   * Encrypt data using AES-256-CBC
   * @param data Data to encrypt (string or Buffer)
   * @returns Base64 encoded encrypted data
   */
  encrypt(data: string | Buffer): string {
    try {
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
      
      // Encrypt the data
      const encryptedData = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);
      
      // Return IV + encrypted data as base64
      return Buffer.concat([iv, encryptedData]).toString('base64');
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
      // Convert base64 to buffer
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // Extract IV (first 16 bytes)
      const iv = buffer.slice(0, 16);
      
      // Extract encrypted data (everything after IV)
      const data = buffer.slice(16);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
      
      // Decrypt the data
      const decryptedData = Buffer.concat([
        decipher.update(data),
        decipher.final()
      ]);
      
      return decryptedData.toString();
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

let encryption: Encryption | null = null;

/**
 * Initialize the encryption service with a key
 * @param key The encryption key to use
 */
export const initializeEncryption = (key: string): void => {
  encryption = new Encryption(key);
};

/**
 * Get the encryption service
 * @returns The encryption service instance
 */
export const getEncryption = (): Encryption => {
  if (!encryption) {
    throw new Error('Encryption service not initialized');
  }
  return encryption;
};
