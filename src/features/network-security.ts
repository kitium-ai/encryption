export type NetworkSecurityConfig = {
  allowPublicAccess: boolean;
  enablePrivateEndpoint: boolean;
  allowedIPs?: string[];
  allowedCIDRs?: string[];
};

export type AccessControlPolicy = {
  ruleId: string;
  effect: 'allow' | 'deny';
  principal: string;
  action: string[];
  resource: string[];
  conditions?: Record<string, string | string[]>;
};

/**
 * Network security and access controls
 * Phase 2: Network isolation and firewall rules
 */
export class NetworkSecurityManager {
  private readonly accessControlPolicies: Map<string, AccessControlPolicy> = new Map();

  constructor(private readonly config: NetworkSecurityConfig) {
    this.validateConfig();
  }

  /**
   * Validate network security configuration
   */
  private validateConfig(): void {
    if (!this.config.allowPublicAccess && !this.config.enablePrivateEndpoint) {
      throw new Error(
        'At least one access method must be enabled (public or private)'
      );
    }
  }

  /**
   * Check if an IP is allowed
   */
  isIPAllowed(ip: string): boolean {
    if (this.config.allowPublicAccess) {
      return true;
    }

    if (this.config.allowedIPs) {
      return this.config.allowedIPs.includes(ip);
    }

    if (this.config.allowedCIDRs) {
      return this.isCIDRMatch(ip, this.config.allowedCIDRs);
    }

    return false;
  }

  /**
   * Check if IP matches any CIDR block
   */
  private isCIDRMatch(ip: string, cidrs: string[]): boolean {
    // Simplified CIDR matching - in production use a proper IP library
    for (const cidr of cidrs) {
      if (cidr === '*' || ip.startsWith(cidr.split('/')[0])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add access control policy
   */
  addPolicy(policy: AccessControlPolicy): void {
    this.accessControlPolicies.set(policy.ruleId, policy);
  }

  /**
   * Remove access control policy
   */
  removePolicy(ruleId: string): void {
    this.accessControlPolicies.delete(ruleId);
  }

  /**
   * Get policy by ID
   */
  getPolicy(ruleId: string): AccessControlPolicy | undefined {
    return this.accessControlPolicies.get(ruleId);
  }

  /**
   * List all policies
   */
  listPolicies(): AccessControlPolicy[] {
    return Array.from(this.accessControlPolicies.values());
  }

  /**
   * Evaluate access for principal and action
   */
  evaluateAccess(
    principal: string,
    action: string,
    resource: string
  ): boolean {
    // Check deny policies first
    for (const policy of this.accessControlPolicies.values()) {
      if (policy.effect === 'deny' && this.policyMatches(policy, principal, action, resource)) {
        return false;
      }
    }

    // Check allow policies
    for (const policy of this.accessControlPolicies.values()) {
      if (policy.effect === 'allow' && this.policyMatches(policy, principal, action, resource)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if policy matches principal, action, and resource
   */
  private policyMatches(
    policy: AccessControlPolicy,
    principal: string,
    action: string,
    resource: string
  ): boolean {
    const principalMatches =
      policy.principal === '*' || policy.principal === principal;
    const actionMatches = policy.action.some(
      (a) => a === '*' || a === action
    );
    const resourceMatches = policy.resource.some(
      (r) => r === '*' || r === resource
    );

    return principalMatches && actionMatches && resourceMatches;
  }

  /**
   * Enable/disable public access
   */
  setPublicAccessEnabled(enabled: boolean): void {
    this.config.allowPublicAccess = enabled;
  }

  /**
   * Enable/disable private endpoint
   */
  setPrivateEndpointEnabled(enabled: boolean): void {
    this.config.enablePrivateEndpoint = enabled;
  }

  /**
   * Get network configuration summary
   */
  getConfigSummary(): {
    publicAccessEnabled: boolean;
    privateEndpointEnabled: boolean;
    allowedIPCount: number;
    allowedCIDRCount: number;
    policyCount: number;
    } {
    return {
      publicAccessEnabled: this.config.allowPublicAccess,
      privateEndpointEnabled: this.config.enablePrivateEndpoint,
      allowedIPCount: this.config.allowedIPs?.length ?? 0,
      allowedCIDRCount: this.config.allowedCIDRs?.length ?? 0,
      policyCount: this.accessControlPolicies.size,
    };
  }
}
