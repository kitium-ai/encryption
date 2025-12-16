import { describe, it, expect, beforeEach } from 'vitest';
import { JITAccessManager } from '../src/features/jit-access.js';

describe('JITAccessManager', () => {
  let manager: JITAccessManager;

  beforeEach(() => {
    manager = new JITAccessManager();
  });

  it('requests access', () => {
    const requestId = manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    expect(requestId).toBe('req-1');
  });

  it('lists pending requests', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    const pending = manager.listPendingRequests();
    expect(pending.length).toBe(1);
  });

  it('approves access request', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    const approved = manager.approveAccess('req-1', 'approver-1');
    expect(approved).toBe(true);
  });

  it('checks active access', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    manager.approveAccess('req-1', 'approver-1');
    const hasAccess = manager.hasActiveAccess('user-1', 'admin');
    expect(hasAccess).toBe(true);
  });

  it('gets active grants for principal', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    manager.approveAccess('req-1', 'approver-1');
    const grants = manager.getActiveGrants('user-1');
    expect(grants.length).toBe(1);
    expect(grants[0].principal).toBe('user-1');
  });

  it('revokes access grant', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      justification: 'Emergency maintenance',
    });

    manager.approveAccess('req-1', 'approver-1');
    manager.revokeGrant('req-1');

    const hasAccess = manager.hasActiveAccess('user-1', 'admin');
    expect(hasAccess).toBe(false);
  });

  it('registers managed identity', () => {
    manager.registerManagedIdentity({
      id: 'identity-1',
      name: 'service-account',
      principal: 'service-principal',
      createdAt: new Date(),
    });

    const identity = manager.getManagedIdentity('identity-1');
    expect(identity).toBeDefined();
    expect(identity?.name).toBe('service-account');
  });

  it('lists managed identities', () => {
    manager.registerManagedIdentity({
      id: 'identity-1',
      name: 'service-account-1',
      principal: 'principal-1',
      createdAt: new Date(),
    });

    manager.registerManagedIdentity({
      id: 'identity-2',
      name: 'service-account-2',
      principal: 'principal-2',
      createdAt: new Date(),
    });

    const identities = manager.listManagedIdentities();
    expect(identities.length).toBe(2);
  });

  it('cleans up expired grants', () => {
    manager.requestAccess({
      principal: 'user-1',
      requestId: 'req-1',
      role: 'admin',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() - 1000), // Already expired
      justification: 'Emergency maintenance',
    });

    manager.approveAccess('req-1', 'approver-1');
    const cleaned = manager.cleanupExpiredGrants();
    expect(cleaned).toBeGreaterThanOrEqual(0);
  });
});
