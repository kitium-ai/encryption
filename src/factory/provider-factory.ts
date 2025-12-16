import type { AuditSink } from '../audit.js';
import { AuditedCryptoOperations, AuditedSignatureOperations } from '../decorators/audit.js';
import {
  type CircuitBreakerConfig,
  CircuitBreakerHealthMonitoring,
} from '../decorators/circuit-breaker.js';
import {
  InstrumentedCryptoOperations,
  InstrumentedSignatureOperations,
  type MetricsCollector,
} from '../decorators/metrics.js';
import {
  PolicyEnforcedCryptoOperations,
  PolicyEnforcedSignatureOperations,
} from '../decorators/policy.js';
import {
  RetryableCryptoOperations,
  RetryableSignatureOperations,
  type RetryConfig,
} from '../decorators/retry.js';
import { ProviderAdapter } from '../interfaces/adapter.js';
import type {
  CryptoOperations,
  HealthMonitoring,
  KeyManagement,
  SignatureOperations,
} from '../interfaces/core.js';
import type { EncryptionProvider } from '../providers/base.js';
import { LocalCryptoOperations } from '../providers/local/crypto-ops.js';
import { LocalHealthMonitoring } from '../providers/local/health.js';
import { LocalKeyManagement } from '../providers/local/key-mgmt.js';
import { LocalSignatureOperations } from '../providers/local/signature-ops.js';
import type { AuditEvent } from '../types.js';
import type { PolicyChecker } from '../utils/policy.js';

/**
 * Provider factory options for composing providers with decorators
 */
export type ProviderFactoryOptions = {
  // Core provider components
  cryptoOps: CryptoOperations;
  signatureOps: SignatureOperations;
  keyMgmt: KeyManagement;
  health: HealthMonitoring;

  // Provider metadata
  name: string;
  defaultKeyId: string;

  // Optional decorators
  auditSink?: AuditSink;
  policyChecker?: PolicyChecker;
  retryConfig?: RetryConfig;
  metricsCollector?: MetricsCollector;
  circuitBreakerConfig?: CircuitBreakerConfig;
};

/**
 * Factory that composes providers with decorators in the correct order
 * Decorator order (outermost to innermost):
 * 1. Metrics (for full latency including retries)
 * 2. Retry (before audit to avoid duplicate events)
 * 3. Audit (logs all attempts)
 * 4. Policy (enforces before operation)
 * 5. Core implementation
 *
 * @param options Provider configuration and decorators
 * @returns Configured and decorated encryption provider
 */
export function createProvider(options: ProviderFactoryOptions): EncryptionProvider {
  let cryptoOps: CryptoOperations = options.cryptoOps;
  let signatureOps: SignatureOperations = options.signatureOps;
  let health: HealthMonitoring = options.health;

  // Layer 1: Policy enforcement (innermost, runs first)
  if (options.policyChecker) {
    cryptoOps = new PolicyEnforcedCryptoOperations(
      cryptoOps,
      options.defaultKeyId,
      options.policyChecker
    );
    signatureOps = new PolicyEnforcedSignatureOperations(
      signatureOps,
      options.defaultKeyId,
      options.policyChecker
    );
  }

  // Layer 2: Audit (captures success/failure)
  if (options.auditSink) {
    const auditSink = options.auditSink;
    const emitter = (event: AuditEvent): void | Promise<void> => auditSink.record(event);
    cryptoOps = new AuditedCryptoOperations(cryptoOps, options.name, emitter);
    signatureOps = new AuditedSignatureOperations(signatureOps, options.name, emitter);
  }

  // Layer 3: Retry logic
  if (options.retryConfig) {
    cryptoOps = new RetryableCryptoOperations(cryptoOps, options.retryConfig);
    signatureOps = new RetryableSignatureOperations(signatureOps, options.retryConfig);
  }

  // Layer 4: Metrics/observability (outermost, captures full latency)
  if (options.metricsCollector) {
    cryptoOps = new InstrumentedCryptoOperations(cryptoOps, options.metricsCollector);
    signatureOps = new InstrumentedSignatureOperations(signatureOps, options.metricsCollector);
  }

  // Health with circuit breaker
  if (options.circuitBreakerConfig) {
    health = new CircuitBreakerHealthMonitoring(health, options.circuitBreakerConfig);
  }

  return new ProviderAdapter(cryptoOps, signatureOps, options.keyMgmt, health, options.name);
}

/**
 * Convenience factory for local provider with optional decorators
 * Simplifies common use case of creating a local provider with audit, policy, etc.
 *
 * @example
 * const provider = createDecoratedLocalProvider({
 *   auditSink: new ConsoleAuditSink(),
 *   policyChecker: myPolicyChecker,
 *   retryConfig: { maxAttempts: 3 },
 *   metricsCollector: prometheusCollector,
 * });
 */
export function createDecoratedLocalProvider(
  options: {
    defaultKeyId?: string;
    auditSink?: AuditSink;
    policyChecker?: PolicyChecker;
    retryConfig?: RetryConfig;
    metricsCollector?: MetricsCollector;
    circuitBreakerConfig?: CircuitBreakerConfig;
  } = {}
): EncryptionProvider {
  const keyId = options.defaultKeyId ?? 'local-default';

  const cryptoOps = new LocalCryptoOperations(keyId);
  const signatureOps = new LocalSignatureOperations(keyId);
  const keyMgmt = new LocalKeyManagement(cryptoOps);
  const health = new LocalHealthMonitoring('local');

  return createProvider({
    cryptoOps,
    signatureOps,
    keyMgmt,
    health,
    name: 'local',
    defaultKeyId: keyId,
    ...options,
  });
}
