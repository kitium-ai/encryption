import type { EncryptionProvider } from '../providers/base.js';
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
import type {
  CryptoOperations,
  HealthMonitoring,
  KeyManagement,
  RequestContext,
  SignatureOperations,
} from './core.js';

/**
 * Adapter that bridges segregated interfaces to the legacy monolithic EncryptionProvider interface
 * This allows new implementations to be composed from focused interfaces while maintaining
 * backward compatibility with existing code
 */
export class ProviderAdapter implements EncryptionProvider {
  readonly name: string;

  constructor(
    private readonly crypto: CryptoOperations,
    private readonly signature: SignatureOperations,
    private readonly keyMgmt: KeyManagement,
    private readonly health: HealthMonitoring,
    name: string
  ) {
    this.name = name;
  }

  /**
   * Delegate to CryptoOperations
   */
  encrypt(request: EncryptionRequest): Promise<EncryptionResult> {
    return this.crypto.encrypt(request as EncryptionRequest & RequestContext);
  }

  /**
   * Delegate to CryptoOperations
   */
  decrypt(request: DecryptionRequest): Promise<Uint8Array> {
    return this.crypto.decrypt(request as DecryptionRequest & RequestContext);
  }

  /**
   * Delegate to SignatureOperations
   */
  sign(request: SignatureRequest): Promise<SignatureResult> {
    return this.signature.sign(request as SignatureRequest & RequestContext);
  }

  /**
   * Delegate to SignatureOperations
   */
  verify(request: VerificationRequest): Promise<boolean> {
    return this.signature.verify(request as VerificationRequest & RequestContext);
  }

  /**
   * Delegate to KeyManagement
   */
  generateKey(): Promise<KeyMetadata> {
    return this.keyMgmt.generateKey();
  }

  /**
   * Delegate to KeyManagement
   */
  rotateKey(keyId: string): Promise<KeyMetadata> {
    return this.keyMgmt.rotateKey(keyId);
  }

  /**
   * Delegate to KeyManagement
   */
  getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    return this.keyMgmt.getKeyMetadata(keyId);
  }

  /**
   * Delegate to HealthMonitoring
   */
  healthCheck(): Promise<HealthCheck> {
    return this.health.healthCheck();
  }
}
