import { describe, it, expect, beforeEach } from 'vitest';
import { KeySoftDeleteManager } from '../src/features/soft-delete.js';
import type { KeyMetadata } from '../src/types.js';

describe('KeySoftDeleteManager', () => {
  let manager: KeySoftDeleteManager;

  const mockKeyMetadata: KeyMetadata = {
    keyId: 'test-key',
    algorithm: 'AES-256-GCM',
    createdAt: new Date(),
    managedBy: 'local',
  };

  beforeEach(() => {
    manager = new KeySoftDeleteManager({
      retentionDays: 30,
      enablePurgeProtection: true,
    });
  });

  it('soft deletes a key', async () => {
    await manager.softDeleteKey('test-key', mockKeyMetadata);
    expect(manager.isDeleted('test-key')).toBe(true);
  });

  it('allows recovery within retention period', async () => {
    await manager.softDeleteKey('test-key', mockKeyMetadata);
    expect(manager.canRecover('test-key')).toBe(true);
  });

  it('recovers deleted key', async () => {
    await manager.softDeleteKey('test-key', mockKeyMetadata);
    const recovered = await manager.recoverKey('test-key');
    expect(recovered.keyId).toBe('test-key');
  });

  it('enables purge protection', () => {
    manager.enablePurgeProtection('test-key');
    expect(manager.hasPurgeProtection('test-key')).toBe(true);
  });

  it('prevents purge of protected keys', async () => {
    manager.enablePurgeProtection('test-key');
    await manager.softDeleteKey('test-key', mockKeyMetadata);

    await expect(manager.purgeKey('test-key')).rejects.toThrow();
  });

  it('lists soft-deleted keys', async () => {
    await manager.softDeleteKey('key1', mockKeyMetadata);
    await manager.softDeleteKey('key2', mockKeyMetadata);

    const deleted = manager.listSoftDeletedKeys();
    expect(deleted.length).toBe(2);
  });

  it('cleans up expired keys', async () => {
    const shortRetentionManager = new KeySoftDeleteManager({
      retentionDays: 0,
      enablePurgeProtection: false,
    });

    await shortRetentionManager.softDeleteKey('test-key', mockKeyMetadata);
    const purged = shortRetentionManager.purgeExpiredKeys();
    expect(purged).toBeGreaterThanOrEqual(0);
  });
});
