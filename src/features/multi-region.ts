export type MultiRegionConfig = {
  primaryRegion: string;
  replicaRegions: string[];
  enableAutoFailover: boolean;
  consistencyModel: 'strong' | 'eventual';
};

export type RegionalKeyState = {
  region: string;
  keyId: string;
  lastSyncedAt: Date;
  isSynced: boolean;
  latencyMs?: number;
};

/**
 * Multi-region key replication with automatic failover
 * Phase 3: High availability and disaster recovery
 */
export class MultiRegionKeyManager {
  private readonly regionalStates: Map<string, RegionalKeyState[]> = new Map();
  private readonly replicationLog: Array<{
    timestamp: Date;
    keyId: string;
    fromRegion: string;
    toRegion: string;
    status: 'success' | 'failed';
  }> = [];

  constructor(private readonly config: MultiRegionConfig) {}

  /**
   * Replicate key to region
   */
  async replicateKey(
    keyId: string,
    targetRegion: string
  ): Promise<boolean> {
    try {
      if (!this.regionalStates.has(keyId)) {
        // Initialize with primary region on first replication
        const primaryState: RegionalKeyState = {
          region: this.config.primaryRegion,
          keyId,
          lastSyncedAt: new Date(),
          isSynced: true,
        };
        this.regionalStates.set(keyId, [primaryState]);
      }

      const state: RegionalKeyState = {
        region: targetRegion,
        keyId,
        lastSyncedAt: new Date(),
        isSynced: true,
      };

      this.regionalStates.get(keyId)!.push(state);

      this.replicationLog.push({
        timestamp: new Date(),
        keyId,
        fromRegion: this.config.primaryRegion,
        toRegion: targetRegion,
        status: 'success',
      });

      return true;
    } catch (error) {
      this.replicationLog.push({
        timestamp: new Date(),
        keyId,
        fromRegion: this.config.primaryRegion,
        toRegion: targetRegion,
        status: 'failed',
      });

      return false;
    }
  }

  /**
   * Replicate key to all configured regions
   */
  async replicateKeyToAllRegions(keyId: string): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const region of this.config.replicaRegions) {
      const success = await this.replicateKey(keyId, region);
      results.set(region, success);
    }

    return results;
  }

  /**
   * Get regional key state
   */
  getRegionalState(keyId: string, region: string): RegionalKeyState | undefined {
    return this.regionalStates.get(keyId)?.find((s) => s.region === region);
  }

  /**
   * List all regions with key
   */
  getKeyRegions(keyId: string): string[] {
    return this.regionalStates.get(keyId)?.map((s) => s.region) ?? [];
  }

  /**
   * Check replication status
   */
  isFullyReplicated(keyId: string): boolean {
    const regions = this.getKeyRegions(keyId);
    return (
      regions.includes(this.config.primaryRegion) &&
      this.config.replicaRegions.every((r) => regions.includes(r))
    );
  }

  /**
   * Promote replica region to primary
   */
  async promoteRegion(newPrimaryRegion: string): Promise<boolean> {
    if (!this.config.replicaRegions.includes(newPrimaryRegion)) {
      return false;
    }

    const oldPrimary = this.config.primaryRegion;
    this.config.primaryRegion = newPrimaryRegion;

    // Update replica list
    this.config.replicaRegions = [
      ...this.config.replicaRegions.filter((r) => r !== newPrimaryRegion),
      oldPrimary,
    ];

    return true;
  }

  /**
   * Get replication health
   */
  getReplicationHealth(): {
    primaryRegion: string;
    replicaRegions: string[];
    totalKeys: number;
    fullyReplicatedKeys: number;
    replicationSuccessRate: number;
    } {
    const totalKeys = this.regionalStates.size;
    let fullyReplicatedKeys = 0;

    for (const keyId of this.regionalStates.keys()) {
      if (this.isFullyReplicated(keyId)) {
        fullyReplicatedKeys += 1;
      }
    }

    const successfulReplications = this.replicationLog.filter(
      (l) => l.status === 'success'
    ).length;
    const successRate =
      this.replicationLog.length > 0
        ? (successfulReplications / this.replicationLog.length) * 100
        : 0;

    return {
      primaryRegion: this.config.primaryRegion,
      replicaRegions: [...this.config.replicaRegions],
      totalKeys,
      fullyReplicatedKeys,
      replicationSuccessRate: successRate,
    };
  }

  /**
   * Get replication history for key
   */
  getReplicationHistory(keyId: string): typeof this.replicationLog {
    return this.replicationLog.filter((l) => l.keyId === keyId);
  }

  /**
   * Mark key as out of sync
   */
  markOutOfSync(keyId: string, region: string): void {
    const state = this.getRegionalState(keyId, region);
    if (state) {
      state.isSynced = false;
    }
  }

  /**
   * Resync key to region
   */
  async resyncKeyToRegion(keyId: string, region: string): Promise<boolean> {
    const state = this.getRegionalState(keyId, region);
    if (!state) {
      return false;
    }

    state.isSynced = true;
    state.lastSyncedAt = new Date();
    return true;
  }
}
