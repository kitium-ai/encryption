import type { HealthCheck, HealthMonitoring } from '../../interfaces/core.js';

// Re-export for convenience
export type { HealthCheck };

/**
 * Local health monitoring implementation
 * Single responsibility: provide health check endpoint
 */
export class LocalHealthMonitoring implements HealthMonitoring {
  constructor(private readonly providerName: string) {}

  healthCheck(): Promise<HealthCheck> {
    return Promise.resolve({
      provider: this.providerName,
      healthy: true,
      latencyMs: 1,
      details: 'local crypto provider ready',
    });
  }
}
