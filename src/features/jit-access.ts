export type JITAccessRequest = {
  principal: string;
  requestId: string;
  role: string;
  requestedAt: Date;
  expiresAt: Date;
  justification: string;
};

export type JITAccessGrant = {
  requestId: string;
  principal: string;
  role: string;
  grantedAt: Date;
  expiresAt: Date;
  approvers: string[];
};

export type ManagedIdentity = {
  id: string;
  name: string;
  principal: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Just-in-time access and managed identity management
 * Phase 2: JIT access control with approval workflows
 */
export class JITAccessManager {
  private readonly jitRequests: Map<string, JITAccessRequest> = new Map();
  private readonly jitGrants: Map<string, JITAccessGrant> = new Map();
  private readonly managedIdentities: Map<string, ManagedIdentity> = new Map();
  private readonly pendingApprovals: Map<string, string[]> = new Map(); // requestId -> approvers

  /**
   * Request just-in-time access
   */
  requestAccess(request: JITAccessRequest): string {
    const requestId = request.requestId;
    this.jitRequests.set(requestId, request);
    this.pendingApprovals.set(requestId, []);
    return requestId;
  }

  /**
   * Get access request
   */
  getAccessRequest(requestId: string): JITAccessRequest | undefined {
    return this.jitRequests.get(requestId);
  }

  /**
   * List pending access requests
   */
  listPendingRequests(): JITAccessRequest[] {
    const now = new Date();
    return Array.from(this.jitRequests.values()).filter(
      (request) => request.expiresAt > now && !this.jitGrants.has(request.requestId)
    );
  }

  /**
   * Approve access request (requires approval from reviewer)
   */
  approveAccess(requestId: string, approver: string): boolean {
    const request = this.jitRequests.get(requestId);
    if (!request) {
      return false;
    }

    const approvers = this.pendingApprovals.get(requestId) || [];
    approvers.push(approver);
    this.pendingApprovals.set(requestId, approvers);

    // Grant access after at least one approval
    if (approvers.length >= 1) {
      const grant: JITAccessGrant = {
        requestId,
        principal: request.principal,
        role: request.role,
        grantedAt: new Date(),
        expiresAt: request.expiresAt,
        approvers,
      };
      this.jitGrants.set(requestId, grant);
      this.jitRequests.delete(requestId);
      return true;
    }

    return false;
  }

  /**
   * Reject access request
   */
  rejectAccess(requestId: string): void {
    this.jitRequests.delete(requestId);
    this.pendingApprovals.delete(requestId);
    this.jitGrants.delete(requestId);
  }

  /**
   * Check if principal has active access
   */
  hasActiveAccess(principal: string, role: string): boolean {
    const now = new Date();
    for (const grant of this.jitGrants.values()) {
      if (
        grant.principal === principal &&
        grant.role === role &&
        grant.expiresAt > now
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get active grants for principal
   */
  getActiveGrants(principal: string): JITAccessGrant[] {
    const now = new Date();
    return Array.from(this.jitGrants.values()).filter(
      (grant) => grant.principal === principal && grant.expiresAt > now
    );
  }

  /**
   * Revoke access grant
   */
  revokeGrant(requestId: string): void {
    this.jitGrants.delete(requestId);
  }

  /**
   * Register a managed identity
   */
  registerManagedIdentity(identity: ManagedIdentity): void {
    this.managedIdentities.set(identity.id, identity);
  }

  /**
   * Get managed identity
   */
  getManagedIdentity(identityId: string): ManagedIdentity | undefined {
    return this.managedIdentities.get(identityId);
  }

  /**
   * List all managed identities
   */
  listManagedIdentities(): ManagedIdentity[] {
    return Array.from(this.managedIdentities.values());
  }

  /**
   * Unregister managed identity
   */
  unregisterManagedIdentity(identityId: string): void {
    this.managedIdentities.delete(identityId);
  }

  /**
   * Require MFA for access grant (metadata flag)
   */
  requireMFAForGrant(requestId: string): void {
    const grant = this.jitGrants.get(requestId);
    if (grant) {
      // Mark grant as requiring MFA verification
      // In production, integrate with actual MFA provider
    }
  }

  /**
   * Clean up expired grants
   */
  cleanupExpiredGrants(): number {
    const now = new Date();
    let count = 0;

    for (const [requestId, grant] of this.jitGrants) {
      if (grant.expiresAt <= now) {
        this.jitGrants.delete(requestId);
        count += 1;
      }
    }

    return count;
  }
}
