import { setTimeout as delay } from 'node:timers/promises';

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
import type { EncryptionProvider } from './base.js';
import { LocalEncryptionProvider } from './local.js';

export type KmsFlavor = 'aws-kms' | 'gcp-kms' | 'azure-keyvault' | 'vault-transit';

export type GenericKmsOptions = {
  flavor: KmsFlavor;
  latencyMs?: number;
};

export class GenericKmsProvider implements EncryptionProvider {
  readonly name: string;
  private readonly local: LocalEncryptionProvider;
  private readonly latencyMs: number;

  constructor(options: GenericKmsOptions) {
    this.name = options.flavor;
    this.local = new LocalEncryptionProvider();
    this.latencyMs = options.latencyMs ?? 5;
  }

  private async jitter(): Promise<void> {
    await delay(this.latencyMs);
  }

  async encrypt(request: EncryptionRequest): Promise<EncryptionResult> {
    await this.jitter();
    return this.local.encrypt(request);
  }

  async decrypt(request: DecryptionRequest): Promise<Uint8Array> {
    await this.jitter();
    return this.local.decrypt(request);
  }

  async sign(request: SignatureRequest): Promise<SignatureResult> {
    await this.jitter();
    return this.local.sign(request);
  }

  async verify(request: VerificationRequest): Promise<boolean> {
    await this.jitter();
    return this.local.verify(request);
  }

  async generateKey(): Promise<KeyMetadata> {
    await this.jitter();
    const meta = await this.local.generateKey();
    return { ...meta, managedBy: this.name as KeyMetadata['managedBy'] };
  }

  async rotateKey(keyId: string): Promise<KeyMetadata> {
    await this.jitter();
    const meta = await this.local.rotateKey(keyId);
    return { ...meta, managedBy: this.name as KeyMetadata['managedBy'] };
  }

  async getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    await this.jitter();
    const meta = await this.local.getKeyMetadata(keyId);
    return { ...meta, managedBy: this.name as KeyMetadata['managedBy'] };
  }

  async healthCheck(): Promise<HealthCheck> {
    await this.jitter();
    return {
      provider: this.name,
      healthy: true,
      latencyMs: this.latencyMs,
      details: `${this.name} emulated`,
    };
  }
}
