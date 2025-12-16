import { setTimeout as delay } from 'node:timers/promises';

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
 * Retry configuration
 */
export type RetryConfig = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // Error codes that should trigger retry
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
};

/**
 * Executes an operation with exponential backoff retry logic
 * Improves resilience against transient failures
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const error_ = error instanceof Error ? error : new Error(String(error));
      lastError = error_;

      // Check if error is retryable
      const isRetryable =
        config.retryableErrors?.some((code) => (error as Record<string, unknown>).code === code) ?? true;

      if (!isRetryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      await delay(delayMs);
      delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  if (lastError) {
    throw lastError;
  }
}

/**
 * Retry decorator for CryptoOperations
 * Adds automatic retry with exponential backoff for transient failures
 */
export class RetryableCryptoOperations extends CryptoOperationsDecorator {
  constructor(
    wrapped: CryptoOperations,
    private readonly config: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    super(wrapped);
  }

  encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    return withRetry(() => super.encrypt(request), this.config);
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    return withRetry(() => super.decrypt(request), this.config);
  }
}

/**
 * Retry decorator for SignatureOperations
 * Adds automatic retry with exponential backoff for transient failures
 */
export class RetryableSignatureOperations extends SignatureOperationsDecorator {
  constructor(
    wrapped: SignatureOperations,
    private readonly config: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    super(wrapped);
  }

  sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    return withRetry(() => super.sign(request), this.config);
  }

  verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    return withRetry(() => super.verify(request), this.config);
  }
}
