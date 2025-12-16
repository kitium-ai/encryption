import type { CryptoOperations, RequestContext,SignatureOperations } from '../interfaces/core.js';
import type { AuditEvent, AuditEventType ,
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../types.js';
import { CryptoOperationsDecorator, SignatureOperationsDecorator } from './base.js';

export type AuditEmitter = (event: AuditEvent) => void | Promise<void>;

/**
 * Creates an audit event with common properties
 * Eliminates duplication of audit event creation throughout the codebase
 */
function createAuditEvent(
  type: AuditEventType,
  provider: string,
  keyId: string | undefined,
  algorithm: string | undefined,
  success: boolean,
  correlationId?: string
): AuditEvent {
  return {
    type,
    provider,
    keyId,
    metadata: algorithm ? { algorithm } : undefined,
    timestamp: new Date(),
    success,
    correlationId,
  };
}

/**
 * Audit decorator for CryptoOperations
 * Centralizes all audit event emission - eliminates 8+ duplications in local.ts
 * Ensures consistent audit logging across all crypto operations
 */
export class AuditedCryptoOperations extends CryptoOperationsDecorator {
  constructor(
    wrapped: CryptoOperations,
    private readonly providerName: string,
    private readonly emitter: AuditEmitter
  ) {
    super(wrapped);
  }

  async encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    try {
      const result = await super.encrypt(request);
      await this.emitter(
        createAuditEvent(
          'encrypt',
          this.providerName,
          result.keyId,
          result.algorithm,
          true,
          request.correlationId
        )
      );
      return result;
    } catch (error) {
      await this.emitter(
        createAuditEvent(
          'encrypt',
          this.providerName,
          request.keyId,
          request.algorithm,
          false,
          request.correlationId
        )
      );
      throw error;
    }
  }

  async decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    try {
      const result = await super.decrypt(request);
      await this.emitter(
        createAuditEvent(
          'decrypt',
          this.providerName,
          request.keyId,
          request.algorithm,
          true,
          request.correlationId
        )
      );
      return result;
    } catch (error) {
      await this.emitter(
        createAuditEvent(
          'decrypt',
          this.providerName,
          request.keyId,
          request.algorithm,
          false,
          request.correlationId
        )
      );
      throw error;
    }
  }
}

/**
 * Audit decorator for SignatureOperations
 * Centralizes all signature audit event emission
 */
export class AuditedSignatureOperations extends SignatureOperationsDecorator {
  constructor(
    wrapped: SignatureOperations,
    private readonly providerName: string,
    private readonly emitter: AuditEmitter
  ) {
    super(wrapped);
  }

  async sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    try {
      const result = await super.sign(request);
      await this.emitter(
        createAuditEvent(
          'sign',
          this.providerName,
          result.keyId,
          result.algorithm,
          true,
          request.correlationId
        )
      );
      return result;
    } catch (error) {
      await this.emitter(
        createAuditEvent(
          'sign',
          this.providerName,
          request.keyId,
          request.algorithm,
          false,
          request.correlationId
        )
      );
      throw error;
    }
  }

  async verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    try {
      const isValid = await super.verify(request);
      await this.emitter(
        createAuditEvent(
          'verify',
          this.providerName,
          request.keyId,
          request.algorithm,
          isValid,
          request.correlationId
        )
      );
      return isValid;
    } catch (error) {
      await this.emitter(
        createAuditEvent(
          'verify',
          this.providerName,
          request.keyId,
          request.algorithm,
          false,
          request.correlationId
        )
      );
      throw error;
    }
  }
}
