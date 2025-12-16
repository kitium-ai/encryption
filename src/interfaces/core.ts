import type {
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  HealthCheck,
  KeyMetadata,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../types.js';

/**
 * Request context for correlation tracking and metadata
 */
export type RequestContext = {
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Core encryption/decryption operations
 * Focused single responsibility: manage plaintext encryption and decryption
 */
export type CryptoOperations = {
  /**
   * Encrypt plaintext using the specified key and algorithm
   */
  encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult>;

  /**
   * Decrypt ciphertext using the specified key and algorithm
   */
  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array>;
}

/**
 * Digital signature operations
 * Focused single responsibility: manage signing and verification
 */
export type SignatureOperations = {
  /**
   * Create a digital signature for a payload
   */
  sign(request: SignatureRequest & RequestContext): Promise<SignatureResult>;

  /**
   * Verify a digital signature
   */
  verify(request: VerificationRequest & RequestContext): Promise<boolean>;
}

/**
 * Key lifecycle management
 * Focused single responsibility: manage key generation, rotation, and metadata
 */
export type KeyManagement = {
  /**
   * Generate a new cryptographic key
   */
  generateKey(): Promise<KeyMetadata>;

  /**
   * Rotate an existing key
   */
  rotateKey(keyId: string): Promise<KeyMetadata>;

  /**
   * Get metadata for a key
   */
  getKeyMetadata(keyId: string): Promise<KeyMetadata>;
}

/**
 * Health monitoring and readiness checks
 * Focused single responsibility: monitor provider health and availability
 */
export type HealthMonitoring = {
  /**
   * Check provider health and readiness
   */
  healthCheck(): Promise<HealthCheck>;
}

/**
 * Auditing capability (optional mixin)
 * Allows providers to emit audit events
 */
export type Auditable = {
  /**
   * Called when audit events are emitted (optional)
   */
  onAudit?(event: AuditEvent): void | Promise<void>;
}

/**
 * Legacy: Combined provider interface
 * @deprecated Use segregated interfaces instead (CryptoOperations, SignatureOperations, KeyManagement, HealthMonitoring)
 */
export type EncryptionProviderCompat = CryptoOperations & SignatureOperations & KeyManagement & HealthMonitoring;
