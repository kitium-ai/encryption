import type { CryptoOperations, RequestContext,SignatureOperations } from '../interfaces/core.js';
import type {
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../types.js';
import type { PolicyChecker } from '../utils/policy.js';
import { CryptoOperationsDecorator, SignatureOperationsDecorator } from './base.js';

/**
 * Policy enforcement decorator for CryptoOperations
 * Centralizes policy enforcement - eliminates 4 duplicated enforce() calls in local.ts
 * Ensures consistent policy checking across all operations
 */
export class PolicyEnforcedCryptoOperations extends CryptoOperationsDecorator {
  constructor(
    wrapped: CryptoOperations,
    private readonly defaultKeyId: string,
    private readonly policyChecker: PolicyChecker
  ) {
    super(wrapped);
  }

  encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    this.policyChecker.enforce('encrypt', {
      keyId,
      algorithm: request.algorithm,
    });
    return super.encrypt(request);
  }

  decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    const keyId = request.keyId ?? this.defaultKeyId;
    this.policyChecker.enforce('decrypt', {
      keyId,
      algorithm: request.algorithm,
    });
    return super.decrypt(request);
  }
}

/**
 * Policy enforcement decorator for SignatureOperations
 * Centralizes signature policy enforcement
 */
export class PolicyEnforcedSignatureOperations extends SignatureOperationsDecorator {
  constructor(
    wrapped: SignatureOperations,
    private readonly defaultKeyId: string,
    private readonly policyChecker: PolicyChecker
  ) {
    super(wrapped);
  }

  sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    this.policyChecker.enforce('sign', {
      keyId,
      algorithm: request.algorithm,
    });
    return super.sign(request);
  }

  verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    const keyId = request.keyId ?? this.defaultKeyId;
    this.policyChecker.enforce('verify', {
      keyId,
      algorithm: request.algorithm,
    });
    return super.verify(request);
  }
}
