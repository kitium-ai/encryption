import { describe, expect, it } from 'vitest';

import { LocalEncryptionProvider } from '../src/providers/local.js';
import { encryptString, decryptToString } from '../src/helpers.js';
import { EnvelopeEncrypter } from '../src/envelope.js';

describe('LocalEncryptionProvider', () => {
  it('encrypts and decrypts strings', async () => {
    const provider = new LocalEncryptionProvider();
    const encrypted = await encryptString(provider, 'hello-world', {});
    const decrypted = await decryptToString(provider, encrypted);
    expect(decrypted).toBe('hello-world');
  });

  it('supports envelope encryption', async () => {
    const provider = new LocalEncryptionProvider();
    const envelope = new EnvelopeEncrypter(provider);
    const wrapped = await envelope.encrypt({ plaintext: Buffer.from('secret') });
    const decrypted = await envelope.decrypt(wrapped);
    expect(Buffer.from(decrypted).toString()).toBe('secret');
  });
});
