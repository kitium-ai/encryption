import crypto from 'node:crypto';

import type { RequestContext, SignatureOperations } from '../../interfaces/core.js';
import { AlgorithmRegistry } from '../../strategies/registry.js';
import type { SignatureRequest, SignatureResult, VerificationRequest } from '../../types.js';

/**
 * Local signing/verification implementation
 * Single responsibility: manage signing and verification operations
 * Does NOT handle encryption, key management, or policy enforcement
 */
export class LocalSignatureOperations implements SignatureOperations {
  private readonly keys = new Map<string, Buffer>();
  private readonly registry = new AlgorithmRegistry();

  constructor(private readonly defaultKeyId: string) {}

  async sign(request: SignatureRequest & RequestContext): Promise<SignatureResult> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const algorithm = request.algorithm ?? 'ED25519';

    // Get or auto-provision signing key
    let signingKey = this.keys.get(`${keyId}-sign`);
    if (!signingKey) {
      signingKey = crypto.randomBytes(32);
      this.keys.set(`${keyId}-sign`, signingKey);
    }

    const strategy = this.registry.getSigningStrategy(algorithm);
    const { signature, publicKey } = await strategy.sign(request.payload, signingKey);

    return { signature, keyId, algorithm, publicKey };
  }

  async verify(request: VerificationRequest & { publicKey?: Uint8Array } & RequestContext): Promise<boolean> {
    const keyId = request.keyId ?? this.defaultKeyId;
    const algorithm = request.algorithm ?? 'ED25519';

    let publicKey: Uint8Array;

    if (request.publicKey) {
      publicKey = request.publicKey;
    } else {
      const seed = this.keys.get(`${keyId}-sign`);
      if (!seed) {
        return false;
      }

      const strategy = this.registry.getSigningStrategy(algorithm);
      const result = await strategy.sign(new Uint8Array(0), seed); // Just to get public key
      publicKey = result.publicKey;
    }

    const strategy = this.registry.getSigningStrategy(algorithm);
    return strategy.verify(request.payload, request.signature, publicKey);
  }

  // Package-internal methods for key management
  hasSigningKey(keyId: string): boolean {
    return this.keys.has(`${keyId}-sign`);
  }

  setSigningKey(keyId: string, key: Buffer): void {
    this.keys.set(`${keyId}-sign`, key);
  }

  getSigningKey(keyId: string): Buffer | undefined {
    return this.keys.get(`${keyId}-sign`);
  }
}
