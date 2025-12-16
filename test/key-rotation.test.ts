import { describe, it, expect, beforeEach } from 'vitest';
import { KeyRotationManager } from '../src/features/key-rotation.js';
import type { EncryptionProvider, KeyMetadata } from '../src/types.js';

const mockProvider: EncryptionProvider = {
  name: 'mock',
  async encrypt() {
    return {
      ciphertext: new Uint8Array(),
      iv: new Uint8Array(),
      keyId: 'test-key',
      algorithm: 'AES-256-GCM',
    };
  },
  async decrypt() {
    return new Uint8Array();
  },
  async sign() {
    return { signature: new Uint8Array(), keyId: 'test-key', algorithm: 'ED25519' };
  },
  async verify() {
    return true;
  },
  async generateKey() {
    return {
      keyId: 'test-key',
      algorithm: 'AES-256-GCM',
      createdAt: new Date(),
      managedBy: 'local',
    };
  },
  async rotateKey(keyId: string) {
    return {
      keyId: `${keyId}-v2`,
      algorithm: 'AES-256-GCM',
      createdAt: new Date(),
      managedBy: 'local',
    };
  },
  async getKeyMetadata(keyId: string) {
    return {
      keyId,
      algorithm: 'AES-256-GCM',
      createdAt: new Date(),
      managedBy: 'local',
    };
  },
  async healthCheck() {
    return { provider: 'mock', healthy: true };
  },
};

describe('KeyRotationManager', () => {
  let manager: KeyRotationManager;

  beforeEach(() => {
    manager = new KeyRotationManager(mockProvider);
  });

  it('initializes key rotation tracking', async () => {
    const state = await manager.initializeKeyRotation('test-key', {
      autoRotateEnabled: true,
      rotationIntervalDays: 90,
    });

    expect(state.keyId).toBe('test-key');
    expect(state.rotationCount).toBe(0);
  });

  it('detects when key needs rotation', async () => {
    const policy = {
      autoRotateEnabled: true,
      rotationIntervalDays: 0, // Rotate immediately
    };

    await manager.initializeKeyRotation('test-key', policy);
    expect(manager.shouldRotate('test-key')).toBe(true);
  });

  it('performs key rotation', async () => {
    const policy = {
      autoRotateEnabled: true,
      rotationIntervalDays: 0,
    };

    await manager.initializeKeyRotation('test-key', policy);
    const rotated = await manager.rotateKeyIfNeeded('test-key', policy);

    expect(rotated).not.toBeNull();
    expect(rotated?.keyId).toContain('test-key');
  });

  it('tracks rotation state', async () => {
    const policy = {
      autoRotateEnabled: true,
      rotationIntervalDays: 90,
    };

    await manager.initializeKeyRotation('test-key', policy);
    const state = manager.getRotationState('test-key');

    expect(state).toBeDefined();
    expect(state?.rotationCount).toBe(0);
  });
});
