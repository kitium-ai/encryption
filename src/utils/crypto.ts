import crypto from 'crypto';

export function generateNonce(size: number): Uint8Array {
  return crypto.randomBytes(size);
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function zeroize(buffer: Uint8Array): void {
  buffer.fill(0);
}

export function randomBytes(size: number): Uint8Array {
  return crypto.randomBytes(size);
}

export async function deriveKeyScrypt(password: string, salt: Uint8Array, keyLength = 32): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Uint8Array(derivedKey as Buffer));
      }
    });
  });
}

export async function deriveKeyArgon2id(password: string, salt: Uint8Array, options?: { iterations?: number; memory?: number }): Promise<Uint8Array> {
  const { hash } = await import('argon2-browser');
  const res = await hash({
    pass: password,
    salt,
    type: 'Argon2id',
    time: options?.iterations ?? 3,
    mem: options?.memory ?? 65536,
    hashLen: 32,
  });
  return new Uint8Array(res.hash);
}
