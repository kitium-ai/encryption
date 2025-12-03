import { TextEncoder, TextDecoder } from 'util';

import { EncryptionProvider } from './providers/base.js';
import { EncryptionRequest, EncryptionResult, SignatureRequest, SignatureResult } from './types.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptString(provider: EncryptionProvider, input: string, options: Omit<EncryptionRequest, 'plaintext'>): Promise<EncryptionResult> {
  return provider.encrypt({ ...options, plaintext: encoder.encode(input) });
}

export async function decryptToString(provider: EncryptionProvider, request: Omit<EncryptionRequest, 'plaintext'> & { ciphertext: Uint8Array; iv: Uint8Array; authTag?: Uint8Array }): Promise<string> {
  const plaintext = await provider.decrypt(request as unknown as EncryptionRequest & { iv: Uint8Array; authTag?: Uint8Array });
  return decoder.decode(plaintext);
}

export async function encryptJson<T>(provider: EncryptionProvider, value: T, options: Omit<EncryptionRequest, 'plaintext'>): Promise<EncryptionResult> {
  const serialized = encoder.encode(JSON.stringify(value));
  return provider.encrypt({ ...options, plaintext: serialized });
}

export async function decryptJson<T>(provider: EncryptionProvider, request: Omit<EncryptionRequest, 'plaintext'> & { ciphertext: Uint8Array; iv: Uint8Array; authTag?: Uint8Array }): Promise<T> {
  const plaintext = await provider.decrypt(request as unknown as EncryptionRequest & { iv: Uint8Array; authTag?: Uint8Array });
  return JSON.parse(decoder.decode(plaintext)) as T;
}

export async function signPayload(provider: EncryptionProvider, payload: Uint8Array, options: Omit<SignatureRequest, 'payload'>): Promise<SignatureResult> {
  return provider.sign({ ...options, payload });
}
