import type { EncryptionProvider, KeyMetadata } from '../types.js';

export type SoftDeleteOptions = {
  retentionDays: number;
  enablePurgeProtection: boolean;
};

export type DeletedKeyState = {
  keyId: string;
  deletedAt: Date;
  recoverableUntil: Date;
  originalMetadata: KeyMetadata;
};

/**
 * Soft delete and purge protection for keys
 * Phase 1: Data protection with recovery capabilities
 */
export class KeySoftDeleteManager {
  private readonly deletedKeys: Map<string, DeletedKeyState> = new Map();
  private readonly purgeProtectedKeys: Set<string> = new Set();

  constructor(private readonly options: SoftDeleteOptions) {}

  /**
   * Soft delete a key (recoverable within retention period)
   */
  async softDeleteKey(keyId: string, metadata: KeyMetadata): Promise<void> {
    const now = new Date();
    const recoverableUntil = new Date(
      now.getTime() + this.options.retentionDays * 24 * 60 * 60 * 1000
    );

    this.deletedKeys.set(keyId, {
      keyId,
      deletedAt: now,
      recoverableUntil,
      originalMetadata: metadata,
    });
  }

  /**
   * Check if a key is soft deleted
   */
  isDeleted(keyId: string): boolean {
    return this.deletedKeys.has(keyId);
  }

  /**
   * Check if a key can be recovered
   */
  canRecover(keyId: string): boolean {
    const state = this.deletedKeys.get(keyId);
    if (!state) {return false;}
    return new Date() <= state.recoverableUntil;
  }

  /**
   * Recover a soft-deleted key
   */
  async recoverKey(keyId: string): Promise<KeyMetadata> {
    if (!this.canRecover(keyId)) {
      throw new Error(
        `Key ${keyId} cannot be recovered. Recovery window has expired.`
      );
    }

    const state = this.deletedKeys.get(keyId);
    if (!state) {
      throw new Error(`Key ${keyId} not found in soft delete cache.`);
    }

    this.deletedKeys.delete(keyId);
    return state.originalMetadata;
  }

  /**
   * Permanently purge a soft-deleted key
   */
  async purgeKey(keyId: string): Promise<void> {
    if (this.purgeProtectedKeys.has(keyId)) {
      throw new Error(
        `Key ${keyId} has purge protection enabled. Cannot purge.`
      );
    }

    this.deletedKeys.delete(keyId);
  }

  /**
   * Enable purge protection for a key
   */
  enablePurgeProtection(keyId: string): void {
    if (!this.options.enablePurgeProtection) {
      throw new Error(
        'Purge protection is disabled in configuration. Enable it to use this feature.'
      );
    }

    this.purgeProtectedKeys.add(keyId);
  }

  /**
   * Disable purge protection for a key
   */
  disablePurgeProtection(keyId: string): void {
    this.purgeProtectedKeys.delete(keyId);
  }

  /**
   * Check if a key has purge protection
   */
  hasPurgeProtection(keyId: string): boolean {
    return this.purgeProtectedKeys.has(keyId);
  }

  /**
   * Get state of soft-deleted key
   */
  getDeletedKeyState(keyId: string): DeletedKeyState | undefined {
    return this.deletedKeys.get(keyId);
  }

  /**
   * List all soft-deleted keys
   */
  listSoftDeletedKeys(): DeletedKeyState[] {
    return Array.from(this.deletedKeys.values());
  }

  /**
   * Clean up expired soft-deleted keys
   */
  purgeExpiredKeys(): number {
    const now = new Date();
    let purgedCount = 0;

    for (const [keyId, state] of this.deletedKeys) {
      if (now > state.recoverableUntil) {
        this.deletedKeys.delete(keyId);
        purgedCount += 1;
      }
    }

    return purgedCount;
  }
}
