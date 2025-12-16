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
    const encryptOptions: { additionalData?: Uint8Array; iv?: Uint8Array } = {};
    if (request.additionalData !== undefined) {
      encryptOptions.additionalData = request.additionalData;
    }
    const { ciphertext, iv, authTag } = await strategy.encrypt(request.plaintext, key, encryptOptions);

    const result: EncryptionResult = {
      ciphertext,
      iv,
      authTag: authTag ?? new Uint8Array(0),
      keyId,
      algorithm,
    };
    if (request.additionalData !== undefined) {
      result.additionalData = request.additionalData;
    }
    return result;
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const algorithm = request.algorithm ?? AES_256_GCM;

    const key = this.keys.get(keyId);
    if (!key) {
      return Promise.reject(new KeyNotFoundError(keyId));
    }

    const strategy = this.registry.getEncryptionStrategy(algorithm);
    const decryptOptions: {
      iv: Uint8Array;
      authTag?: Uint8Array;
      additionalData?: Uint8Array;
    } = {
      iv: request.iv,
    };
    if (request.authTag !== undefined) {
      decryptOptions.authTag = request.authTag;
    }
    if (request.additionalData !== undefined) {
      decryptOptions.additionalData = request.additionalData;
    }
    return strategy.decrypt(request.ciphertext, key, decryptOptions);
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
