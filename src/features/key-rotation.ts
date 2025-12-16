import type { EncryptionProvider } from '../interfaces/core.js';
import type { KeyMetadata } from '../types.js';

export type KeyRotationPolicy = {
  autoRotateEnabled: boolean;
  rotationIntervalDays: number;
  rotationWindowDays?: number;
};

export type KeyRotationState = {
  keyId: string;
  lastRotatedAt: Date;
  nextRotationAt: Date;
  rotationCount: number;
};

/**
 * Manages automatic key rotation with configurable policies
 * Phase 1: Automatic key rotation implementation
 */
export class KeyRotationManager {
  private readonly rotationStates: Map<string, KeyRotationState> = new Map();

  constructor(private readonly provider: EncryptionProvider) {}

  /**
   * Initialize rotation tracking for a key
   */
  async initializeKeyRotation(
    keyId: string,
    policy: KeyRotationPolicy
  ): Promise<KeyRotationState> {
    const metadata = await this.provider.getKeyMetadata(keyId);
    const state: KeyRotationState = {
      keyId,
      lastRotatedAt: metadata.createdAt,
      nextRotationAt: this.calculateNextRotationDate(
        metadata.createdAt,
        policy.rotationIntervalDays
      ),
      rotationCount: 0,
    };
    this.rotationStates.set(keyId, state);
    return state;
  }

  /**
   * Check if a key needs rotation
   */
  shouldRotate(keyId: string): boolean {
    const state = this.rotationStates.get(keyId);
    if (!state) {return false;}
    return new Date() >= state.nextRotationAt;
  }

  /**
   * Perform automatic key rotation
   */
  async rotateKeyIfNeeded(
    keyId: string,
    policy: KeyRotationPolicy
  ): Promise<KeyMetadata | null> {
    if (!this.shouldRotate(keyId)) {
      return null;
    }

    const rotated = await this.provider.rotateKey(keyId);
    const state = this.rotationStates.get(keyId);

    if (state) {
      state.lastRotatedAt = new Date();
      state.nextRotationAt = this.calculateNextRotationDate(
        new Date(),
        policy.rotationIntervalDays
      );
      state.rotationCount += 1;
    }

    return rotated;
  }

  /**
   * Get rotation state for a key
   */
  getRotationState(keyId: string): KeyRotationState | undefined {
    return this.rotationStates.get(keyId);
  }

  private calculateNextRotationDate(
    baseDate: Date,
    intervalDays: number
  ): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * Schedule automatic rotations (use with external scheduler)
   */
  async scheduleRotations(
    keys: Array<{ keyId: string; policy: KeyRotationPolicy }>
  ): Promise<Map<string, KeyMetadata | null>> {
    const results = new Map<string, KeyMetadata | null>();

    for (const { keyId, policy } of keys) {
      const result = await this.rotateKeyIfNeeded(keyId, policy);
      results.set(keyId, result);
    }

    return results;
  }
}
