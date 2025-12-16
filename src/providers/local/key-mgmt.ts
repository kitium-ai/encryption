import crypto from 'node:crypto';

import type { KeyManagement } from '../../interfaces/core.js';
import type { Algorithm,KeyMetadata } from '../../types.js';

const AES_256_GCM: Algorithm = 'AES-256-GCM';

/**
 * Local key management implementation
 * Single responsibility: manage key lifecycle (generation, rotation, metadata)
 * Does NOT handle encryption/decryption or policy enforcement
 */
export class LocalKeyManagement implements KeyManagement {
  constructor(
    private readonly cryptoOps: {
      hasKey: (id: string) => boolean;
      setKey: (id: string, key: Buffer) => void;
    }
  ) {}

  generateKey(): Promise<KeyMetadata> {
    const keyId = `local-${crypto.randomUUID()}`;
    const key = crypto.randomBytes(32);
    this.cryptoOps.setKey(keyId, key);

    return Promise.resolve({
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
    });
  }

  rotateKey(keyId: string): Promise<KeyMetadata> {
    const key = crypto.randomBytes(32);
    this.cryptoOps.setKey(keyId, key);

    return Promise.resolve({
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
      version: crypto.randomUUID(),
    });
  }

  getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    if (!this.cryptoOps.hasKey(keyId)) {
      return Promise.reject(new Error(`Unknown key ${keyId}`));
    }

    return Promise.resolve({
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
    });
  }
}
