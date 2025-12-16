import crypto from 'node:crypto';

import { KeyNotFoundError } from '../../errors.js';
import type { CryptoOperations, RequestContext } from '../../interfaces/core.js';
import { AlgorithmRegistry } from '../../strategies/registry.js';
import type {
  Algorithm,
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
} from '../../types.js';

const AES_256_GCM: Algorithm = 'AES-256-GCM';

/**
 * Local encryption/decryption implementation
 * Single responsibility: manage encryption and decryption operations
 * Does NOT handle signing, key management, or policy enforcement
 */
export class LocalCryptoOperations implements CryptoOperations {
  private readonly keys = new Map<string, Buffer>();
  private readonly registry = new AlgorithmRegistry();

  constructor(private readonly defaultKeyId: string) {
    // Auto-provision default key
    if (!this.keys.has(defaultKeyId)) {
      this.keys.set(defaultKeyId, crypto.randomBytes(32));
    }
  }

  async encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const algorithm = request.algorithm ?? AES_256_GCM;

    // Get or auto-provision key
    let key = this.keys.get(keyId);
    if (!key) {
      key = crypto.randomBytes(32);
      this.keys.set(keyId, key);
    }

    // Use strategy pattern - no hardcoded algorithm logic
    const strategy = this.registry.getEncryptionStrategy(algorithm);
    const { ciphertext, iv, authTag } = await strategy.encrypt(request.plaintext, key, {
      additionalData: request.additionalData,
    });

    return {
      ciphertext,
      iv,
      authTag,
      keyId,
      algorithm,
      additionalData: request.additionalData,
    };
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const algorithm = request.algorithm ?? AES_256_GCM;

    const key = this.keys.get(keyId);
    if (!key) {
      return Promise.reject(new KeyNotFoundError(keyId));
    }

    const strategy = this.registry.getEncryptionStrategy(algorithm);
    return strategy.decrypt(request.ciphertext, key, {
      iv: request.iv,
      authTag: request.authTag,
      additionalData: request.additionalData,
    });
  }

  // Package-internal methods for key management
  hasKey(keyId: string): boolean {
    return this.keys.has(keyId);
  }

  setKey(keyId: string, key: Buffer): void {
    this.keys.set(keyId, key);
  }

  getKey(keyId: string): Buffer | undefined {
    return this.keys.get(keyId);
  }
}
