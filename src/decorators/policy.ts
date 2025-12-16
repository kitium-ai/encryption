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

  override encrypt(request: EncryptionRequest & RequestContext): Promise<EncryptionResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const policyData: { keyId: string; algorithm?: string; createdAt?: Date } = { keyId };
    if (request.algorithm !== undefined) {
      policyData.algorithm = request.algorithm;
    }
    this.policyChecker.enforce('encrypt', policyData);
    return super.encrypt(request);
  }

  override decrypt(request: DecryptionRequest & RequestContext): Promise<Uint8Array> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const policyData: { keyId: string; algorithm?: string; createdAt?: Date } = { keyId };
    if (request.algorithm !== undefined) {
      policyData.algorithm = request.algorithm;
    }
    this.policyChecker.enforce('decrypt', policyData);
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

  override sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const policyData: { keyId: string; algorithm?: string; createdAt?: Date } = { keyId };
    if (request.algorithm !== undefined) {
      policyData.algorithm = request.algorithm;
    }
    this.policyChecker.enforce('sign', policyData);
    return super.sign(request);
  }

  override verify(request: VerificationRequest & RequestContext): Promise<boolean> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const policyData: { keyId: string; algorithm?: string; createdAt?: Date } = { keyId };
    if (request.algorithm !== undefined) {
      policyData.algorithm = request.algorithm;
    }
    this.policyChecker.enforce('verify', policyData);
    return super.verify(request);
  }
}
