import crypto from 'node:crypto';

import { UnsupportedAlgorithmError } from '../errors.js';
import type {
  Algorithm,
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
import { generateNonce, zeroize } from '../utils/crypto.js';
import type { PolicyChecker } from '../utils/policy.js';
import type { EncryptionProvider } from './base.js';

const SUPPORTED_ENCRYPTION: Algorithm[] = ['AES-256-GCM'];
const SUPPORTED_SIGNING: Algorithm[] = ['ED25519'];
const AES_256_GCM = 'AES-256-GCM';

export type LocalProviderOptions = {
  defaultEncryptionKeyId?: string;
  auditSink?: (event: AuditEvent) => void | Promise<void>;
  policyChecker?: PolicyChecker;
};

export class LocalEncryptionProvider implements EncryptionProvider {
  readonly name = 'local';
  private readonly encryptionKeyId: string;
  private readonly keys = new Map<string, Buffer>();
  private readonly auditSink?: (event: AuditEvent) => void | Promise<void>;
  private readonly policyChecker?: PolicyChecker;

  constructor(options: LocalProviderOptions = {}) {
    this.encryptionKeyId = options.defaultEncryptionKeyId ?? 'local-default';
    this.auditSink = options.auditSink;
    this.policyChecker = options.policyChecker;
    if (!this.keys.has(this.encryptionKeyId)) {
      this.keys.set(this.encryptionKeyId, crypto.randomBytes(32));
    }
  }

  private async emit(event: AuditEvent): Promise<void> {
    if (this.auditSink) {
      await this.auditSink(event);
    }
  }

  async encrypt(request: EncryptionRequest): Promise<EncryptionResult> {
    this.policyChecker?.enforce('encrypt', { keyId: request.keyId ?? this.encryptionKeyId });
    const keyId = request.keyId ?? this.encryptionKeyId;
    const algorithm = request.algorithm ?? AES_256_GCM;
    if (!SUPPORTED_ENCRYPTION.includes(algorithm)) {
      throw new UnsupportedAlgorithmError(`Algorithm ${algorithm} not supported for encryption`);
    }
    let key = this.keys.get(keyId);
    if (!key) {
      // Auto-provision missing encryption keys for local provider
      key = crypto.randomBytes(32);
      this.keys.set(keyId, key);
    }
    const iv = generateNonce(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16,
    });
    if (request.additionalData) {
      cipher.setAAD(Buffer.from(request.additionalData));
    }
    const ciphertext = Buffer.concat([cipher.update(request.plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result: EncryptionResult = {
      ciphertext,
      iv,
      authTag,
      keyId,
      algorithm,
      additionalData: request.additionalData,
    };
    await this.emit({
      type: 'encrypt',
      provider: this.name,
      keyId,
      metadata: { algorithm },
      timestamp: new Date(),
      success: true,
    });
    return result;
  }

  async decrypt(request: DecryptionRequest): Promise<Uint8Array> {
    this.policyChecker?.enforce('decrypt', { keyId: request.keyId ?? this.encryptionKeyId });
    const keyId = request.keyId ?? this.encryptionKeyId;
    const algorithm = request.algorithm ?? AES_256_GCM;
    if (!SUPPORTED_ENCRYPTION.includes(algorithm)) {
      throw new UnsupportedAlgorithmError(`Algorithm ${algorithm} not supported for decryption`);
    }
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Unknown key ${keyId}`);
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, request.iv, {
      authTagLength: 16,
    });
    if (request.additionalData) {
      decipher.setAAD(Buffer.from(request.additionalData));
    }
    if (request.authTag) {
      decipher.setAuthTag(Buffer.from(request.authTag));
    }
    const plaintext = Buffer.concat([decipher.update(request.ciphertext), decipher.final()]);
    await this.emit({
      type: 'decrypt',
      provider: this.name,
      keyId,
      metadata: { algorithm },
      timestamp: new Date(),
      success: true,
    });
    return plaintext;
  }

  async sign(request: SignatureRequest): Promise<SignatureResult> {
    this.policyChecker?.enforce('sign', { keyId: request.keyId ?? this.encryptionKeyId });
    const keyId = request.keyId ?? this.encryptionKeyId;
    const algorithm = request.algorithm ?? 'ED25519';
    if (!SUPPORTED_SIGNING.includes(algorithm)) {
      throw new UnsupportedAlgorithmError(`Algorithm ${algorithm} not supported for signing`);
    }
    let signingKey = this.keys.get(`${keyId}-sign`);
    if (!signingKey) {
      signingKey = crypto.randomBytes(32);
      this.keys.set(`${keyId}-sign`, signingKey);
    }
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
      publicKeyEncoding: { format: 'pem', type: 'spki' },
      seed: signingKey,
    });
    const signature = crypto.sign(null, Buffer.from(request.payload), privateKey);
    await this.emit({
      type: 'sign',
      provider: this.name,
      keyId,
      metadata: { algorithm },
      timestamp: new Date(),
      success: true,
    });
    // Ensure private/public keys are zeroized/exported as buffers safely
    const privatePem =
      typeof privateKey === 'string'
        ? privateKey
        : privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const publicPem =
      typeof publicKey === 'string'
        ? publicKey
        : publicKey.export({ format: 'pem', type: 'spki' }).toString();
    zeroize(Buffer.from(privatePem));
    return { signature, keyId, algorithm: 'ED25519', publicKey: Buffer.from(publicPem) };
  }

  async verify(request: VerificationRequest & { publicKey?: Uint8Array }): Promise<boolean> {
    const keyId = request.keyId ?? this.encryptionKeyId;
    const algorithm = request.algorithm ?? 'ED25519';
    if (!SUPPORTED_SIGNING.includes(algorithm)) {
      throw new UnsupportedAlgorithmError(`Algorithm ${algorithm} not supported for verification`);
    }
    let publicKeyPem: string | undefined;
    if (request.publicKey) {
      publicKeyPem = crypto
        .createPublicKey({ key: Buffer.from(request.publicKey), format: 'der', type: 'spki' })
        .export({
          format: 'pem',
          type: 'spki',
        }) as string;
    } else {
      const seed = this.keys.get(`${keyId}-sign`);
      if (!seed) {
        return false;
      }
      const { publicKey } = crypto.generateKeyPairSync('ed25519', {
        privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
        publicKeyEncoding: { format: 'pem', type: 'spki' },
        seed,
      });
      publicKeyPem =
        typeof publicKey === 'string'
          ? publicKey
          : publicKey.export({ format: 'pem', type: 'spki' }).toString();
    }
    if (!publicKeyPem) {
      return false;
    }
    const isValid = crypto.verify(
      null,
      Buffer.from(request.payload),
      publicKeyPem,
      Buffer.from(request.signature)
    );
    await this.emit({
      type: 'verify',
      provider: this.name,
      keyId,
      metadata: { algorithm },
      timestamp: new Date(),
      success: isValid,
    });
    return isValid;
  }

  async generateKey(): Promise<KeyMetadata> {
    const keyId = `local-${crypto.randomUUID()}`;
    const key = crypto.randomBytes(32);
    this.keys.set(keyId, key);
    await this.emit({
      type: 'generateKey',
      provider: this.name,
      keyId,
      timestamp: new Date(),
      success: true,
    });
    return {
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
    };
  }

  async rotateKey(keyId: string): Promise<KeyMetadata> {
    const key = crypto.randomBytes(32);
    this.keys.set(keyId, key);
    await this.emit({
      type: 'rotateKey',
      provider: this.name,
      keyId,
      timestamp: new Date(),
      success: true,
    });
    return {
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
      version: crypto.randomUUID(),
    };
  }

  getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    const hasKey = this.keys.has(keyId);
    if (!hasKey) {
      throw new Error(`Unknown key ${keyId}`);
    }
    return Promise.resolve({
      keyId,
      algorithm: AES_256_GCM,
      createdAt: new Date(),
      managedBy: 'local',
    });
  }

  healthCheck(): Promise<HealthCheck> {
    return Promise.resolve({
      provider: this.name,
      healthy: true,
      latencyMs: 1,
      details: 'local crypto provider ready',
    });
  }
}
