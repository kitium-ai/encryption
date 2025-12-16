import type {
  CryptoOperations,
  HealthMonitoring,
  KeyManagement,
  RequestContext,
  SignatureOperations,
} from '../interfaces/core.js';
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
 * Base decorator for CryptoOperations
 * Provides template for adding cross-cutting concerns (logging, metrics, policy, etc.)
 */
export abstract class CryptoOperationsDecorator implements CryptoOperations {
  constructor(protected readonly wrapped: CryptoOperations) {}

  encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    return this.wrapped.encrypt(request);
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    return this.wrapped.decrypt(request);
  }
}

/**
 * Base decorator for SignatureOperations
 * Provides template for adding cross-cutting concerns
 */
export abstract class SignatureOperationsDecorator implements SignatureOperations {
  constructor(protected readonly wrapped: SignatureOperations) {}

  sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    return this.wrapped.sign(request);
  }

  verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    return this.wrapped.verify(request);
  }
}

/**
 * Base decorator for KeyManagement
 * Provides template for adding cross-cutting concerns
 */
export abstract class KeyManagementDecorator implements KeyManagement {
  constructor(protected readonly wrapped: KeyManagement) {}

  generateKey(): Promise<KeyMetadata> {
    return this.wrapped.generateKey();
  }

  rotateKey(keyId: string): Promise<KeyMetadata> {
    return this.wrapped.rotateKey(keyId);
  }

  getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    return this.wrapped.getKeyMetadata(keyId);
  }
}

/**
 * Base decorator for HealthMonitoring
 * Provides template for adding cross-cutting concerns
 */
export abstract class HealthMonitoringDecorator implements HealthMonitoring {
  constructor(protected readonly wrapped: HealthMonitoring) {}

  healthCheck(): Promise<HealthCheck> {
    return this.wrapped.healthCheck();
  }
}
