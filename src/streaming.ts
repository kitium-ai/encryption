import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Transform } from 'stream';

import { Algorithm } from './types.js';

const SUPPORTED: Algorithm[] = ['AES-256-GCM'];

export interface StreamingOptions {
  key: Uint8Array;
  iv?: Uint8Array;
  additionalData?: Uint8Array;
  algorithm?: Algorithm;
}

export function createEncryptionStream(options: StreamingOptions): {
  stream: Transform;
  iv: Uint8Array;
} {
  const algorithm = options.algorithm ?? 'AES-256-GCM';
  if (!SUPPORTED.includes(algorithm)) {
    throw new Error(`Unsupported streaming algorithm ${algorithm}`);
  }
  const iv = options.iv ?? randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', options.key, iv);
  if (options.additionalData) {
    cipher.setAAD(Buffer.from(options.additionalData));
  }
  const stream = new Transform({
    transform(chunk, _encoding, callback) {
      try {
        const data = cipher.update(chunk as Buffer);
        callback(null, data);
      } catch (err) {
        callback(err as Error);
      }
    },
    flush(callback) {
      try {
        const finalChunk = cipher.final();
        const tag = cipher.getAuthTag();
        this.push(finalChunk);
        this.push(tag);
        callback();
      } catch (err) {
        callback(err as Error);
      }
    },
  });
  return { stream, iv };
}

export function createDecryptionStream(
  options: StreamingOptions & { authTag: Uint8Array }
): Transform {
  const algorithm = options.algorithm ?? 'AES-256-GCM';
  if (!SUPPORTED.includes(algorithm)) {
    throw new Error(`Unsupported streaming algorithm ${algorithm}`);
  }
  const decipher = createDecipheriv('aes-256-gcm', options.key, options.iv ?? randomBytes(12));
  if (options.additionalData) {
    decipher.setAAD(Buffer.from(options.additionalData));
  }
  decipher.setAuthTag(Buffer.from(options.authTag));
  return new Transform({
    transform(chunk, _encoding, callback) {
      try {
        const data = decipher.update(chunk as Buffer);
        callback(null, data);
      } catch (err) {
        callback(err as Error);
      }
    },
    flush(callback) {
      try {
        const finalChunk = decipher.final();
        this.push(finalChunk);
        callback();
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}
