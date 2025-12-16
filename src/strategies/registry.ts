import { UnsupportedAlgorithmError } from '../errors.js';
import type { Algorithm } from '../types.js';
import { AesGcmStrategy } from './aes-gcm.js';
import type { EncryptionAlgorithmStrategy, SigningAlgorithmStrategy } from './algorithm.js';
import { Ed25519Strategy } from './ed25519.js';

/**
 * Algorithm registry for managing available encryption and signing strategies
 * Allows dynamic registration of new algorithms without modifying core code (OCP)
 * Centralizes algorithm validation - no more repeated checks throughout codebase
 */
export class AlgorithmRegistry {
  private readonly encryptionStrategies = new Map<Algorithm, EncryptionAlgorithmStrategy>();
  private readonly signingStrategies = new Map<Algorithm, SigningAlgorithmStrategy>();

  constructor() {
    // Register default strategies
    this.registerEncryption(new AesGcmStrategy());
    this.registerSigning(new Ed25519Strategy());
  }

  /**
   * Register a new encryption algorithm strategy
   */
  registerEncryption(strategy: EncryptionAlgorithmStrategy): void {
    this.encryptionStrategies.set(strategy.algorithm, strategy);
  }

  /**
   * Register a new signing algorithm strategy
   */
  registerSigning(strategy: SigningAlgorithmStrategy): void {
    this.signingStrategies.set(strategy.algorithm, strategy);
  }

  /**
   * Get an encryption strategy for the given algorithm
   * @throws UnsupportedAlgorithmError if algorithm is not registered
   */
  getEncryptionStrategy(algorithm: Algorithm): EncryptionAlgorithmStrategy {
    const strategy = this.encryptionStrategies.get(algorithm);
    if (!strategy) {
      throw new UnsupportedAlgorithmError(`No encryption strategy for ${algorithm}`);
    }
    return strategy;
  }

  /**
   * Get a signing strategy for the given algorithm
   * @throws UnsupportedAlgorithmError if algorithm is not registered
   */
  getSigningStrategy(algorithm: Algorithm): SigningAlgorithmStrategy {
    const strategy = this.signingStrategies.get(algorithm);
    if (!strategy) {
      throw new UnsupportedAlgorithmError(`No signing strategy for ${algorithm}`);
    }
    return strategy;
  }

  /**
   * Get all supported encryption algorithms
   */
  getSupportedEncryptionAlgorithms(): Algorithm[] {
    return Array.from(this.encryptionStrategies.keys());
  }

  /**
   * Get all supported signing algorithms
   */
  getSupportedSigningAlgorithms(): Algorithm[] {
    return Array.from(this.signingStrategies.keys());
  }

  /**
   * Check if an encryption algorithm is supported
   */
  supportsEncryption(algorithm: Algorithm): boolean {
    return this.encryptionStrategies.has(algorithm);
  }

  /**
   * Check if a signing algorithm is supported
   */
  supportsSigning(algorithm: Algorithm): boolean {
    return this.signingStrategies.has(algorithm);
  }
}
