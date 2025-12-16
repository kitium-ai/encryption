export type Algorithm =
  | 'AES-256-GCM'
  | 'CHACHA20-POLY1305'
  | 'ED25519'
  | 'ECDSA-P256'
  | 'RSA-OAEP-256'
  | 'ML-KEM'
  | 'ML-DSA'
  | 'SLH-DSA';

export type EncryptionRequest = {
  plaintext: Uint8Array;
  additionalData?: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export type EncryptionResult = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag?: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
  additionalData?: Uint8Array;
}

export type DecryptionRequest = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag?: Uint8Array;
  additionalData?: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export type SignatureRequest = {
  payload: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

export type SignatureResult = {
  signature: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
  publicKey?: Uint8Array;
}

export type VerificationRequest = {
  signature: Uint8Array;
} & SignatureRequest

export type KeyMetadata = {
  keyId: string;
  algorithm: Algorithm;
  createdAt: Date;
  expiresAt?: Date;
  version?: string;
  managedBy: 'local' | 'aws-kms' | 'gcp-kms' | 'azure-keyvault' | 'vault-transit' | 'hsm' | 'external-kms';
  labels?: Record<string, string>;
}

export type HealthCheck = {
  provider: string;
  healthy: boolean;
  latencyMs?: number;
  details?: string;
}

export type DataKey = {
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
  | 'health'
  | 'softDelete'
  | 'restore'
  | 'backup'
  | 'threat';

export type AuditEvent = {
  type: AuditEventType;
  provider: string;
  keyId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  success: boolean;
  correlationId?: string;
}
