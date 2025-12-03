declare module 'argon2-browser' {
  export function hash(options: {
    pass: string | Uint8Array;
    salt?: string | Uint8Array;
    type?: number;
    time?: number;
    mem?: number;
    hashLen?: number;
  }): Promise<{ encoded: string; hash: Uint8Array }>;
}
