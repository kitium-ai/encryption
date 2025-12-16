import type { Algorithm } from '../types.js';

/**
 * Base interface for all algorithm strategies
 */
export type AlgorithmStrategy = {
  /**
   * The algorithm this strategy handles
   */
  readonly algorithm: Algorithm;

  /**
   * Type of algorithm (encryption or signing)
   */
  readonly type: 'encryption' | 'signing';

  /**
   * Check if this strategy supports the given algorithm
   */
  supports(algorithm: Algorithm): boolean;
}

/**
 * Encryption algorithm strategy interface
 * Implementations handle specific encryption algorithms (AES-256-GCM, ChaCha20, etc.)
 */
export type EncryptionAlgorithmStrategy = {
  readonly type: 'encryption';

  /**
   * Encrypt plaintext with a given key and options
   */
  encrypt(
    plaintext: Uint8Array,
    key: Uint8Array,
    options: { additionalData?: Uint8Array; iv?: Uint8Array }
  ): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; authTag?: Uint8Array }>;

  /**
   * Decrypt ciphertext with a given key and options
   */
  decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    options: { iv: Uint8Array; authTag?: Uint8Array; additionalData?: Uint8Array }
  ): Promise<Uint8Array>;
} & AlgorithmStrategy

/**
 * Signing algorithm strategy interface
 * Implementations handle specific signing algorithms (Ed25519, ECDSA, RSA, etc.)
 */
export type SigningAlgorithmStrategy = {
  readonly type: 'signing';

  /**
   * Sign a payload with a private key
   */
  sign(
    payload: Uint8Array,
    privateKey: Uint8Array
  ): Promise<{ signature: Uint8Array; publicKey: Uint8Array }>;

  /**
   * Verify a signature with a public key
   */
  verify(
    payload: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean>;
} & AlgorithmStrategy
