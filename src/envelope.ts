import crypto from 'crypto';

import { EncryptionProvider } from './providers/base.js';
import { randomBytes } from './utils/crypto.js';
import { DecryptionRequest, EncryptionRequest, EncryptionResult } from './types.js';

interface CachedDataKey {
  key: Uint8Array;
  expiresAt: number;
}

export interface EnvelopeOptions {
  dataKeyTtlMs?: number;
}

export class EnvelopeEncrypter {
  private readonly cache = new Map<string, CachedDataKey>();
  private readonly dataKeyTtlMs: number;

  constructor(
    private readonly provider: EncryptionProvider,
    options: EnvelopeOptions = {}
  ) {
    this.dataKeyTtlMs = options.dataKeyTtlMs ?? 5 * 60 * 1000;
  }

  private getCached(keyId: string): Uint8Array | undefined {
    const cached = this.cache.get(keyId);
    if (!cached) {
      return undefined;
    }
    if (cached.expiresAt < Date.now()) {
      this.cache.delete(keyId);
      return undefined;
    }
    return cached.key;
  }

  private setCached(keyId: string, key: Uint8Array) {
    this.cache.set(keyId, { key, expiresAt: Date.now() + this.dataKeyTtlMs });
  }

  async encrypt(
    request: EncryptionRequest
  ): Promise<EncryptionResult & { wrappedDataKey: EncryptionResult }> {
    const keyId = request.keyId ?? 'envelope-master';
    let dataKey = this.getCached(keyId);
    if (!dataKey) {
      dataKey = randomBytes(32);
      this.setCached(keyId, dataKey);
    }

    const wrappedDataKey = await this.provider.encrypt({
      plaintext: dataKey,
      keyId,
      algorithm: 'AES-256-GCM',
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
      algorithm: 'AES-256-GCM',
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
      algorithm: 'AES-256-GCM',
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
}
