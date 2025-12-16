import { ProviderAdapter } from '../../interfaces/adapter.js';
import type {
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  HealthCheck,
  KeyMetadata,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../../types.js';
import type { EncryptionProvider } from '../base.js';
import { LocalCryptoOperations } from './crypto-ops.js';
import { LocalHealthMonitoring } from './health.js';
import { LocalKeyManagement } from './key-mgmt.js';
import { LocalSignatureOperations } from './signature-ops.js';

export type LocalProviderOptions = {
  defaultEncryptionKeyId?: string;
};

/**
 * Refactored LocalEncryptionProvider - composed of focused implementations
 * All duplication eliminated, SOLID principles applied
 * Creates provider by composing segregated interfaces
 * @param options Provider configuration
 * @returns Configured encryption provider
 */
export function createLocalProvider(options: LocalProviderOptions = {}): EncryptionProvider {
  const keyId = options.defaultEncryptionKeyId ?? 'local-default';

  const cryptoOps = new LocalCryptoOperations(keyId);
  const signatureOps = new LocalSignatureOperations(keyId);
  const keyMgmt = new LocalKeyManagement(cryptoOps);
  const health = new LocalHealthMonitoring('local');

  return new ProviderAdapter(cryptoOps, signatureOps, keyMgmt, health, 'local');
}

/**
 * Legacy constructor - maintained for backward compatibility
 * @deprecated Use createLocalProvider() factory function instead
 *
 * Kept for backward compatibility with existing code that imports LocalEncryptionProvider
 * All new code should use createLocalProvider() which provides better composability
 * with decorators and other advanced features
 */
export class LocalEncryptionProvider implements EncryptionProvider {
  private readonly provider: EncryptionProvider;

  readonly name: string;

  constructor(options: LocalProviderOptions = {}) {
    this.provider = createLocalProvider(options);
    this.name = 'local';
  }

  encrypt(request: EncryptionRequest): Promise<EncryptionResult> {
    return this.provider.encrypt(request);
  }

  decrypt(request: DecryptionRequest): Promise<Uint8Array> {
    return this.provider.decrypt(request);
  }

  sign(request: SignatureRequest): Promise<SignatureResult> {
    return this.provider.sign(request);
  }

  verify(request: VerificationRequest): Promise<boolean> {
    return this.provider.verify(request);
  }

  generateKey(): Promise<KeyMetadata> {
    return this.provider.generateKey();
  }

  rotateKey(keyId: string): Promise<KeyMetadata> {
    return this.provider.rotateKey(keyId);
  }

  getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    return this.provider.getKeyMetadata(keyId);
  }

  healthCheck(): Promise<HealthCheck> {
    return this.provider.healthCheck();
  }
}

export { LocalCryptoOperations, LocalHealthMonitoring,LocalKeyManagement, LocalSignatureOperations };
