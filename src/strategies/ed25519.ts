import crypto from 'node:crypto';

import type { Algorithm } from '../types.js';
import { zeroize } from '../utils/crypto.js';
import type { SigningAlgorithmStrategy } from './algorithm.js';

/**
 * Ed25519 signing strategy
 * Modern elliptic curve signature scheme - faster and more secure than RSA
 * Deterministic and resistant to side-channel attacks
 */
export class Ed25519Strategy implements SigningAlgorithmStrategy {
  readonly algorithm: Algorithm = 'ED25519';
  readonly type = 'signing' as const;

  supports(algorithm: Algorithm): boolean {
    return algorithm === 'ED25519';
  }

  sign(
    payload: Uint8Array,
    seed: Uint8Array
  ): Promise<{ signature: Uint8Array; publicKey: Uint8Array }> {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
      publicKeyEncoding: { format: 'pem', type: 'spki' },
      seed,
    });

    const signature = crypto.sign(null, Buffer.from(payload), privateKey);

    // Secure cleanup of private key
    const privatePem =
      typeof privateKey === 'string'
        ? privateKey
        : privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    zeroize(Buffer.from(privatePem));

    // Export public key
    const publicPem =
      typeof publicKey === 'string'
        ? publicKey
        : publicKey.export({ format: 'pem', type: 'spki' }).toString();

    return Promise.resolve({ signature, publicKey: Buffer.from(publicPem) });
  }

  verify(
    payload: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    let publicKeyPem: string;

    try {
      publicKeyPem = crypto
        .createPublicKey({ key: Buffer.from(publicKey), format: 'der', type: 'spki' })
        .export({ format: 'pem', type: 'spki' }) as string;
    } catch {
      return Promise.resolve(false);
    }

    try {
      const isValid = crypto.verify(null, Buffer.from(payload), publicKeyPem, Buffer.from(signature));
      return Promise.resolve(isValid);
    } catch {
      return Promise.resolve(false);
    }
  }
}
