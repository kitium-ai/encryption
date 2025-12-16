import { TextDecoder,TextEncoder } from 'node:util';

import type { EncryptionProvider } from './providers/base.js';
import type {
  DecryptionRequest,
  EncryptionRequest,
  EncryptionResult,
  SignatureRequest,
  SignatureResult,
} from './types.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encryptString(
  provider: EncryptionProvider,
  input: string,
  options: Omit<EncryptionRequest, 'plaintext'>
): Promise<EncryptionResult> {
  return provider.encrypt({ ...options, plaintext: encoder.encode(input) });
}

export async function decryptToString(
  provider: EncryptionProvider,
  request: DecryptionRequest
): Promise<string> {
  const plaintext = await provider.decrypt(request);
  return decoder.decode(plaintext);
}

export function encryptJson<T>(
  provider: EncryptionProvider,
  value: T,
  options: Omit<EncryptionRequest, 'plaintext'>
): Promise<EncryptionResult> {
  const serialized = encoder.encode(JSON.stringify(value));
  return provider.encrypt({ ...options, plaintext: serialized });
}

export async function decryptJson<T>(
  provider: EncryptionProvider,
  request: DecryptionRequest
): Promise<T> {
  const plaintext = await provider.decrypt(request);
  return JSON.parse(decoder.decode(plaintext)) as T;
}

export function signPayload(
  provider: EncryptionProvider,
  payload: Uint8Array,
  options: Omit<SignatureRequest, 'payload'>
): Promise<SignatureResult> {
  return provider.sign({ ...options, payload });
}
