import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Transform } from 'node:stream';

import type { Algorithm } from './types.js';

const SUPPORTED: Algorithm[] = ['AES-256-GCM'];
const AES_256_GCM = 'AES-256-GCM';

export type StreamingOptions = {
  key: Uint8Array;
  iv?: Uint8Array;
  additionalData?: Uint8Array;
  algorithm?: Algorithm;
}

export function createEncryptionStream(options: StreamingOptions): {
  stream: Transform;
  iv: Uint8Array;
} {
  const algorithm = options.algorithm ?? AES_256_GCM;
  if (!SUPPORTED.includes(algorithm)) {
    throw new Error(`Unsupported streaming algorithm ${algorithm}`);
  }
  const iv = options.iv ?? randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', options.key, iv);
  if (options.additionalData) {
    cipher.setAAD(Buffer.from(options.additionalData));
  }
   
  const stream = new Transform({
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    transform(chunk, _encoding, callback) {
      try {
        const data = cipher.update(chunk as Buffer);
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(null, data);
      } catch (error) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(error as Error);
      }
    },
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    flush(callback) {
      try {
        const finalChunk = cipher.final();
        const tag = cipher.getAuthTag();
        this.push(finalChunk);
        this.push(tag);
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback();
      } catch (error) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(error as Error);
      }
    },
  });
  return { stream, iv };
}

export function createDecryptionStream(
  options: StreamingOptions & { authTag: Uint8Array }
): Transform {
  const algorithm = options.algorithm ?? AES_256_GCM;
  if (!SUPPORTED.includes(algorithm)) {
    throw new Error(`Unsupported streaming algorithm ${algorithm}`);
  }
  const decipher = createDecipheriv('aes-256-gcm', options.key, options.iv ?? randomBytes(12));
  if (options.additionalData) {
    decipher.setAAD(Buffer.from(options.additionalData));
  }
  decipher.setAuthTag(Buffer.from(options.authTag));
   
  return new Transform({
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    transform(chunk, _encoding, callback) {
      try {
        const data = decipher.update(chunk as Buffer);
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(null, data);
      } catch (error) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(error as Error);
      }
    },
    // eslint-disable-next-line promise/prefer-await-to-callbacks
    flush(callback) {
      try {
        const finalChunk = decipher.final();
        this.push(finalChunk);
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback();
      } catch (error) {
        // eslint-disable-next-line promise/prefer-await-to-callbacks
        callback(error as Error);
      }
    },
  });
}
