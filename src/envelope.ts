import crypto from 'node:crypto';

import type { EncryptionProvider } from './providers/base.js';
import type { DecryptionRequest, EncryptionRequest, EncryptionResult } from './types.js';
import { randomBytes } from './utils/crypto.js';
import { LRUCache } from './utils/lru-cache.js';

const AES_256_GCM = 'AES-256-GCM';

export type EnvelopeOptions = {
  dataKeyTtlMs?: number;
  maxCachedKeys?: number;
  keyVersion?: string;
};

/**
 * Envelope encryption with data key caching
 * Implements two-layer encryption pattern for better key management:
 * 1. Master key encrypts data keys (wrapped by provider)
 * 2. Data key encrypts actual payload
 *
 * Improves performance by caching data keys (with TTL)
 * and prevents unbounded memory growth with LRU eviction
 */
export class EnvelopeEncrypter {
  private readonly cache: LRUCache<string, Uint8Array>;
  private readonly keyVersion: string;

  constructor(
    private readonly provider: EncryptionProvider,
    options: EnvelopeOptions = {}
  ) {
    const ttl = options.dataKeyTtlMs ?? 5 * 60 * 1000;
    const maxSize = options.maxCachedKeys ?? 100;
    this.cache = new LRUCache(maxSize, ttl);
    this.keyVersion = options.keyVersion ?? 'v1';
  }

  async encrypt(
    request: EncryptionRequest
  ): Promise<EncryptionResult & { wrappedDataKey: EncryptionResult }> {
    const keyId = request.keyId ?? 'envelope-master';
    const cacheKey = `${keyId}:${this.keyVersion}`;

    let dataKey = this.cache.get(cacheKey);
    if (!dataKey) {
      dataKey = randomBytes(32);
      this.cache.set(cacheKey, dataKey);
    }

    const wrappedDataKey = await this.provider.encrypt({
      plaintext: dataKey,
      keyId,
      algorithm: AES_256_GCM,
      additionalData: request.additionalData,
    });

    const iv = randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
    if (request.additionalData) {
      cipher.setAAD(Buffer.from(request.additionalData));
    }
    const ciphertext = Buffer.concat([cipher.update(request.plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv,
      authTag,
      keyId,
      algorithm: AES_256_GCM,
      additionalData: request.additionalData,
      wrappedDataKey,
    };
  }

  async decrypt(
    payload: EncryptionResult & { wrappedDataKey: EncryptionResult }
  ): Promise<Uint8Array> {
    const dataKey = await this.provider.decrypt({
      ciphertext: payload.wrappedDataKey.ciphertext,
      iv: payload.wrappedDataKey.iv,
      authTag: payload.wrappedDataKey.authTag,
      keyId: payload.keyId,
      algorithm: AES_256_GCM,
      additionalData: payload.wrappedDataKey.additionalData,
    } as DecryptionRequest);

    const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, payload.iv);
    if (payload.additionalData) {
      decipher.setAAD(Buffer.from(payload.additionalData));
    }
    if (payload.authTag) {
      decipher.setAuthTag(Buffer.from(payload.authTag));
    }
    return Buffer.concat([decipher.update(payload.ciphertext), decipher.final()]);
  }

  /**
   * Rotate to a new key version
   * Clears cache and updates version for key rotation
   */
  rotateKeyVersion(newVersion: string): void {
    this.cache.clear();
    // @ts-expect-error keyVersion is readonly but we need to update it for key rotation
    this.keyVersion = newVersion;
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return this.cache.getStats();
  }
}
