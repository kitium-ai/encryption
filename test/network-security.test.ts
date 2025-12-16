import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkSecurityManager } from '../src/features/network-security.js';

describe('NetworkSecurityManager', () => {
  let manager: NetworkSecurityManager;

  beforeEach(() => {
    manager = new NetworkSecurityManager({
      allowPublicAccess: true,
      enablePrivateEndpoint: true,
    });
  });

  it('validates network configuration', () => {
    expect(() => {
      new NetworkSecurityManager({
        allowPublicAccess: false,
        enablePrivateEndpoint: false,
      });
    }).toThrow();
  });

  it('checks if IP is allowed', () => {
    const manager2 = new NetworkSecurityManager({
      allowPublicAccess: false,
      enablePrivateEndpoint: true,
      allowedIPs: ['192.168.1.1'],
    });

    expect(manager2.isIPAllowed('192.168.1.1')).toBe(true);
    expect(manager2.isIPAllowed('192.168.1.2')).toBe(false);
  });

  it('adds access control policy', () => {
    manager.addPolicy({
      ruleId: 'rule-1',
      effect: 'allow',
      principal: 'user-1',
      action: ['encrypt', 'decrypt'],
      resource: ['key-1'],
    });

    const policy = manager.getPolicy('rule-1');
    expect(policy).toBeDefined();
    expect(policy?.principal).toBe('user-1');
  });

  it('evaluates access with policies', () => {
    manager.addPolicy({
      ruleId: 'allow-encrypt',
      effect: 'allow',
      principal: 'user-1',
      action: ['encrypt'],
      resource: ['key-1'],
    });

    manager.addPolicy({
      ruleId: 'deny-decrypt',
      effect: 'deny',
      principal: 'user-1',
      action: ['decrypt'],
      resource: ['key-1'],
    });

    const canEncrypt = manager.evaluateAccess('user-1', 'encrypt', 'key-1');
    const canDecrypt = manager.evaluateAccess('user-1', 'decrypt', 'key-1');

    expect(canEncrypt).toBe(true);
    expect(canDecrypt).toBe(false);
  });

  it('lists all policies', () => {
    manager.addPolicy({
      ruleId: 'rule-1',
      effect: 'allow',
      principal: 'user-1',
      action: ['encrypt'],
      resource: ['key-1'],
    });

    manager.addPolicy({
      ruleId: 'rule-2',
      effect: 'allow',
      principal: 'user-2',
      action: ['decrypt'],
      resource: ['key-2'],
    });

    const policies = manager.listPolicies();
    expect(policies.length).toBe(2);
  });

  it('enables/disables public access', () => {
    manager.setPublicAccessEnabled(false);
    const summary = manager.getConfigSummary();
    expect(summary.publicAccessEnabled).toBe(false);
  });

  it('enables/disables private endpoint', () => {
    manager.setPrivateEndpointEnabled(false);
    const summary = manager.getConfigSummary();
    expect(summary.privateEndpointEnabled).toBe(false);
  });

  it('provides configuration summary', () => {
    const summary = manager.getConfigSummary();
    expect(summary.publicAccessEnabled).toBe(true);
    expect(summary.privateEndpointEnabled).toBe(true);
    expect(summary.policyCount).toBeGreaterThanOrEqual(0);
  });
});
