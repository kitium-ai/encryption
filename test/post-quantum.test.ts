import { describe, it, expect } from 'vitest';
import { PostQuantumProvider } from '../src/features/post-quantum.js';

describe('PostQuantumProvider', () => {
  let provider: PostQuantumProvider;

  beforeEach(() => {
    provider = new PostQuantumProvider();
  });

  it('generates ML-KEM key pair', async () => {
    const keyPair = await provider.generateMLKEMKeyPair();
    expect(keyPair.algorithm).toBe('ML-KEM');
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('generates ML-DSA key pair', async () => {
    const keyPair = await provider.generateMLDSAKeyPair();
    expect(keyPair.algorithm).toBe('ML-DSA');
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('generates SLH-DSA key pair', async () => {
    const keyPair = await provider.generateSLHDSAKeyPair();
    expect(keyPair.algorithm).toBe('SLH-DSA');
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
  });

  it('encapsulates with ML-KEM', async () => {
    const keyPair = await provider.generateMLKEMKeyPair();
    const result = await provider.mlkemEncapsulate(keyPair.publicKey);
    expect(result.sharedSecret).toBeDefined();
    expect(result.ciphertext).toBeDefined();
  });

  it('decapsulates with ML-KEM', async () => {
    const keyPair = await provider.generateMLKEMKeyPair();
    const encapsulated = await provider.mlkemEncapsulate(keyPair.publicKey);
    const sharedSecret = await provider.mlkemDecapsulate(
      keyPair.privateKey,
      encapsulated.ciphertext
    );
    expect(sharedSecret).toBeDefined();
  });

  it('signs with ML-DSA', async () => {
    const keyPair = await provider.generateMLDSAKeyPair();
    const message = new Uint8Array(32);
    const signature = await provider.mldsaSign(keyPair.privateKey, message);
    expect(signature).toBeDefined();
  });

  it('verifies ML-DSA signature', async () => {
    const keyPair = await provider.generateMLDSAKeyPair();
    const message = new Uint8Array(32);
    const signature = await provider.mldsaSign(keyPair.privateKey, message);
    const isValid = await provider.mldsaVerify(
      keyPair.publicKey,
      message,
      signature
    );
    expect(isValid).toBe(true);
  });

  it('checks if algorithm is quantum-resistant', () => {
    expect(provider.isQuantumResistant('ML-KEM')).toBe(true);
    expect(provider.isQuantumResistant('ML-DSA')).toBe(true);
    expect(provider.isQuantumResistant('SLH-DSA')).toBe(true);
    expect(provider.isQuantumResistant('ED25519')).toBe(false);
  });

  it('recommends quantum-resistant algorithm for encryption', () => {
    const algo = provider.getRecommendedAlgorithm('encryption');
    expect(algo).toBe('ML-KEM');
  });

  it('recommends quantum-resistant algorithm for signing', () => {
    const algo = provider.getRecommendedAlgorithm('signing');
    expect(algo).toBe('ML-DSA');
  });
});
