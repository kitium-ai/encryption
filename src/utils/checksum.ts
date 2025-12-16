import crypto from 'node:crypto';

export function checksum(input: string | Uint8Array): string {
  const hash = crypto.createHash('sha256');
  if (typeof input === 'string') {
    hash.update(Buffer.from(input));
  } else {
    hash.update(Buffer.from(input));
  }
  return hash.digest('hex');
}
