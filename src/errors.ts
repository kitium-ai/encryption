/**
 * Base encryption error class
 * All encryption-related errors extend this class
 */
export class EncryptionError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly correlationId?: string;

  constructor(
    message: string,
    code = 'ENCRYPTION_ERROR',
    context?: { correlationId?: string; [key: string]: unknown }
  ) {
    super(message);
    this.code = code;
    this.correlationId = context?.correlationId;
    this.context = context;
    this.name = 'EncryptionError';
  }
}

/**
 * Policy violation error
 * Thrown when a policy check fails
 */
export class PolicyViolationError extends EncryptionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'POLICY_VIOLATION', context);
    this.name = 'PolicyViolationError';
  }
}

/**
 * Unsupported algorithm error
 * Thrown when an algorithm is not supported by the provider
 */
export class UnsupportedAlgorithmError extends EncryptionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UNSUPPORTED_ALGORITHM', context);
    this.name = 'UnsupportedAlgorithmError';
  }
}

/**
 * Audit sink error
 * Thrown when an audit sink fails to record an event
 */
export class AuditSinkError extends EncryptionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUDIT_SINK_ERROR', context);
    this.name = 'AuditSinkError';
  }
}

/**
 * Key not found error
 * Thrown when a requested key is not available
 */
export class KeyNotFoundError extends EncryptionError {
  constructor(keyId: string, context?: Record<string, unknown>) {
    super(`Key not found: ${keyId}`, 'KEY_NOT_FOUND', { ...context, keyId });
    this.name = 'KeyNotFoundError';
  }
}

/**
 * Circuit breaker open error
 * Thrown when circuit breaker is open and rejecting requests
 */
export class CircuitBreakerOpenError extends EncryptionError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CIRCUIT_BREAKER_OPEN', context);
    this.name = 'CircuitBreakerOpenError';
  }
}
