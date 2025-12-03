import {
  AuditEvent,
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  HealthCheck,
  KeyMetadata,
  SignatureRequest,
  SignatureResult,
  VerificationRequest,
} from '../types.js';

export interface EncryptionProvider {
  readonly name: string;
  encrypt(request: EncryptionRequest): Promise<EncryptionResult>;
  decrypt(request: DecryptionRequest): Promise<Uint8Array>;
  sign(request: SignatureRequest): Promise<SignatureResult>;
  verify(request: VerificationRequest): Promise<boolean>;
  generateKey(): Promise<KeyMetadata>;
  rotateKey(keyId: string): Promise<KeyMetadata>;
  getKeyMetadata(keyId: string): Promise<KeyMetadata>;
  healthCheck(): Promise<HealthCheck>;
  onAudit?(event: AuditEvent): void | Promise<void>;
}
