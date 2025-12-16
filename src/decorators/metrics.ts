import type { CryptoOperations, RequestContext,SignatureOperations } from '../interfaces/core.js';
import type {
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../types.js';
import { CryptoOperationsDecorator, SignatureOperationsDecorator } from './base.js';

/**
 * Metrics collector interface
 * Allows integration with any metrics backend (Prometheus, DataDog, New Relic, etc.)
 */
export type MetricsCollector = {
  /**
   * Record operation latency in milliseconds
   */
  recordLatency(operation: string, durationMs: number): void;

  /**
   * Increment operation counter
   */
  incrementCounter(operation: string, labels?: Record<string, string>): void;
};

/**
 * Measures latency of an operation and records metrics
 */
async function measureLatency<T>(
  operation: string,
  fn: () => Promise<T>,
  collector: MetricsCollector
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    collector.recordLatency(operation, Date.now() - start);
    collector.incrementCounter(operation, { status: 'success' });
    return result;
  } catch (error) {
    collector.recordLatency(operation, Date.now() - start);
    collector.incrementCounter(operation, { status: 'error' });
    throw error;
  }
}

/**
 * Metrics decorator for CryptoOperations
 * Records latency and error rates for encryption/decryption operations
 * Integrates with observability platforms (Prometheus, DataDog, etc.)
 */
export class InstrumentedCryptoOperations extends CryptoOperationsDecorator {
  constructor(
    wrapped: CryptoOperations,
    private readonly metrics: MetricsCollector
  ) {
    super(wrapped);
  }

  encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    return measureLatency('encrypt', () => super.encrypt(request), this.metrics);
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    return measureLatency('decrypt', () => super.decrypt(request), this.metrics);
  }
}

/**
 * Metrics decorator for SignatureOperations
 * Records latency and error rates for signing/verification operations
 */
export class InstrumentedSignatureOperations extends SignatureOperationsDecorator {
  constructor(
    wrapped: SignatureOperations,
    private readonly metrics: MetricsCollector
  ) {
    super(wrapped);
  }

  sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    return measureLatency('sign', () => super.sign(request), this.metrics);
  }

  verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    return measureLatency('verify', () => super.verify(request), this.metrics);
  }
}
