import { describe, it, expect, beforeEach } from 'vitest';
import { MultiRegionKeyManager } from '../src/features/multi-region.js';

describe('MultiRegionKeyManager', () => {
  let manager: MultiRegionKeyManager;

  beforeEach(() => {
    manager = new MultiRegionKeyManager({
      primaryRegion: 'us-east-1',
      replicaRegions: ['us-west-2', 'eu-west-1'],
      enableAutoFailover: true,
      consistencyModel: 'strong',
    });
  });

  it('replicates key to region', async () => {
    const result = await manager.replicateKey('key-1', 'us-west-2');
    expect(result).toBe(true);
  });

  it('replicates key to all regions', async () => {
    const results = await manager.replicateKeyToAllRegions('key-1');
    expect(results.size).toBe(2);
    expect(results.get('us-west-2')).toBe(true);
    expect(results.get('eu-west-1')).toBe(true);
  });

  it('gets regional key state', async () => {
    await manager.replicateKey('key-1', 'us-west-2');
    const state = manager.getRegionalState('key-1', 'us-west-2');
    expect(state).toBeDefined();
    expect(state?.isSynced).toBe(true);
  });

  it('lists key regions', async () => {
    await manager.replicateKey('key-1', 'us-west-2');
    await manager.replicateKey('key-1', 'eu-west-1');
    const regions = manager.getKeyRegions('key-1');
    expect(regions).toContain('us-west-2');
    expect(regions).toContain('eu-west-1');
  });

  it('checks if key is fully replicated', async () => {
    await manager.replicateKeyToAllRegions('key-1');
    const isFullyReplicated = manager.isFullyReplicated('key-1');
    expect(isFullyReplicated).toBe(true);
  });

  it('promotes replica region to primary', async () => {
    const result = await manager.promoteRegion('us-west-2');
    expect(result).toBe(true);
  });

  it('gets replication health', async () => {
    await manager.replicateKeyToAllRegions('key-1');
    const health = manager.getReplicationHealth();
    expect(health.primaryRegion).toBe('us-east-1');
    expect(health.totalKeys).toBe(1);
    expect(health.replicationSuccessRate).toBeGreaterThan(0);
  });

  it('marks key as out of sync', async () => {
    await manager.replicateKey('key-1', 'us-west-2');
    manager.markOutOfSync('key-1', 'us-west-2');
    const state = manager.getRegionalState('key-1', 'us-west-2');
    expect(state?.isSynced).toBe(false);
  });

  it('resyncs key to region', async () => {
    await manager.replicateKey('key-1', 'us-west-2');
    manager.markOutOfSync('key-1', 'us-west-2');
    const resynced = await manager.resyncKeyToRegion('key-1', 'us-west-2');
    expect(resynced).toBe(true);

    const state = manager.getRegionalState('key-1', 'us-west-2');
    expect(state?.isSynced).toBe(true);
  });

  it('gets replication history', async () => {
    await manager.replicateKey('key-1', 'us-west-2');
    const history = manager.getReplicationHistory('key-1');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].keyId).toBe('key-1');
  });
});
