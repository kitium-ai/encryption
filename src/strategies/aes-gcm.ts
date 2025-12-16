import crypto from 'node:crypto';

import type { Algorithm } from '../types.js';
import { generateNonce } from '../utils/crypto.js';
import type { EncryptionAlgorithmStrategy } from './algorithm.js';

/**
 * AES-256-GCM encryption strategy
 * Implements authenticated encryption with associated data (AEAD)
 * Industry standard for secure encryption with built-in authentication
 */
export class AesGcmStrategy implements EncryptionAlgorithmStrategy {
  readonly algorithm: Algorithm = 'AES-256-GCM';
  readonly type = 'encryption' as const;

  supports(algorithm: Algorithm): boolean {
    return algorithm === 'AES-256-GCM';
  }

  encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    options: { additionalData?: Uint8Array; iv?: Uint8Array }
  ): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; authTag: Uint8Array }> {
    const iv = options.iv ?? generateNonce(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16,
    });

    if (options.additionalData) {
      cipher.setAAD(Buffer.from(options.additionalData));
    }

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Promise.resolve({ ciphertext, iv, authTag });
  }

  decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    options: { iv: Uint8Array; authTag?: Uint8Array; additionalData?: Uint8Array }
  ): Promise<Uint8Array> {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, options.iv, {
      authTagLength: 16,
    });

    if (options.additionalData) {
      decipher.setAAD(Buffer.from(options.additionalData));
    }
    if (options.authTag) {
      decipher.setAuthTag(Buffer.from(options.authTag));
    }

    return Promise.resolve(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
  }
}
