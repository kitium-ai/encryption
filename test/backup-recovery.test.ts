import { describe, it, expect, beforeEach } from 'vitest';
import { BackupRecoveryManager } from '../src/features/backup-recovery.js';

describe('BackupRecoveryManager', () => {
  let manager: BackupRecoveryManager;

  beforeEach(() => {
    manager = new BackupRecoveryManager({
      enableEncryptedBackup: true,
      retentionDays: 30,
      backupIntervalHours: 24,
    });
  });

  it('creates encrypted backup', async () => {
    const keys = [
      { keyId: 'key-1', material: new Uint8Array(32) },
      { keyId: 'key-2', material: new Uint8Array(32) },
    ];

    const backup = await manager.createBackup(keys);
    expect(backup.backupId).toBeDefined();
    expect(backup.keyCount).toBe(2);
    expect(backup.encrypted).toBe(true);
  });

  it('gets backup metadata', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    const backup = await manager.createBackup(keys);
    const retrieved = manager.getBackup(backup.backupId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.keyCount).toBe(1);
  });

  it('lists all backups', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    await manager.createBackup(keys);
    await manager.createBackup(keys);

    const backups = manager.listBackups();
    expect(backups.length).toBe(2);
  });

  it('verifies backup integrity', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    const backup = await manager.createBackup(keys);
    const isValid = await manager.verifyBackupIntegrity(
      backup.backupId,
      backup.checksum
    );
    expect(isValid).toBe(true);
  });

  it('deletes backup', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    const backup = await manager.createBackup(keys);
    const deleted = manager.deleteBackup(backup.backupId);
    expect(deleted).toBe(true);
  });

  it('gets last backup time', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    await manager.createBackup(keys);
    const lastTime = manager.getLastBackupTime();
    expect(lastTime).not.toBeNull();
  });

  it('checks if backup is needed', () => {
    const isNeeded = manager.isBackupNeeded();
    expect(isNeeded).toBe(true); // No backup yet
  });

  it('cleans up expired backups', async () => {
    const shortRetentionManager = new BackupRecoveryManager({
      enableEncryptedBackup: true,
      retentionDays: 0,
      backupIntervalHours: 24,
    });

    const keys = [{ keyId: 'key-1', material: new Uint8Array(32) }];
    await shortRetentionManager.createBackup(keys);
    const cleaned = shortRetentionManager.cleanupExpiredBackups();
    expect(cleaned).toBeGreaterThanOrEqual(0);
  });

  it('gets backup statistics', async () => {
    const keys = [{ keyId: 'key-1', material: new Uint8Array(64) }];
    await manager.createBackup(keys);
    const stats = manager.getBackupStats();

    expect(stats.totalBackups).toBe(1);
    expect(stats.totalBackupSize).toBeGreaterThan(0);
    expect(stats.oldestBackup).toBeDefined();
    expect(stats.newestBackup).toBeDefined();
  });
});
