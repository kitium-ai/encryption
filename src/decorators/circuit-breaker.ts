import { CircuitBreakerOpenError } from '../errors.js';
import type { HealthCheck, HealthMonitoring } from '../interfaces/core.js';
import { HealthMonitoringDecorator } from './base.js';

// Re-export HealthCheck for convenience
export type { HealthCheck };

/**
 * Circuit breaker configuration
 */
export type CircuitBreakerConfig = {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeoutMs: number;
};

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeoutMs: 60000,
};

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker for health monitoring
 * Prevents cascade failures by stopping requests to unhealthy providers
 * Automatically recovers when provider becomes healthy again
 * Implements state machine: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */
export class CircuitBreakerHealthMonitoring extends HealthMonitoringDecorator {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = 0;

  constructor(
    wrapped: HealthMonitoring,
    private readonly config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG
  ) {
    super(wrapped);
  }

  override async healthCheck(): Promise<HealthCheck> {
    const now = Date.now();

    // Circuit is OPEN - reject immediately without calling wrapped provider
    if (this.state === CircuitState.OPEN) {
      if (now < this.nextAttempt) {
        throw new CircuitBreakerOpenError(
          `Circuit breaker OPEN, retry after ${this.nextAttempt - now}ms`
        );
      }
      // Try to transition to HALF_OPEN
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await super.healthCheck();

      if (result.healthy) {
        this.onSuccess();
      } else {
        this.onFailure();
      }

      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful health check
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        // Transition back to CLOSED
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed health check
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      // Transition to OPEN
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeoutMs;
    }
  }

  /**
   * Get current circuit state (useful for monitoring)
   */
  getState(): CircuitState {
    return this.state;
  }
}
