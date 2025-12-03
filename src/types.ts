export type Algorithm =
  | 'AES-256-GCM'
  | 'CHACHA20-POLY1305'
  | 'ED25519'
  | 'ECDSA-P256'
  | 'RSA-OAEP-256';

export interface EncryptionRequest {
  plaintext: Uint8Array;
  additionalData?: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export interface EncryptionResult {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag?: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
  additionalData?: Uint8Array;
}

export interface DecryptionRequest {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag?: Uint8Array;
  additionalData?: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export interface SignatureRequest {
  payload: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export interface SignatureResult {
  signature: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
  publicKey?: Uint8Array;
}

export interface VerificationRequest extends SignatureRequest {
  signature: Uint8Array;
}

export interface KeyMetadata {
  keyId: string;
  algorithm: Algorithm;
  createdAt: Date;
  expiresAt?: Date;
  version?: string;
  managedBy: 'local' | 'aws-kms' | 'gcp-kms' | 'azure-keyvault' | 'vault-transit';
  labels?: Record<string, string>;
}

export interface HealthCheck {
  provider: string;
  healthy: boolean;
  latencyMs?: number;
  details?: string;
}

export interface DataKey {
  key: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
}

export type AuditEventType =
  | 'encrypt'
  | 'decrypt'
  | 'sign'
  | 'verify'
  | 'generateKey'
  | 'rotateKey'
  | 'health';

export interface AuditEvent {
  type: AuditEventType;
  provider: string;
  keyId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  success: boolean;
  correlationId?: string;
}
