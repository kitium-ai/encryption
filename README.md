# @kitiumai/encryption

Enterprise-ready TypeScript encryption SDK with pluggable providers, secure defaults, and ergonomic APIs inspired by major cloud KMS offerings.

## Features

- Core `EncryptionProvider` abstraction with audit hooks, policy enforcement, and health checks.
- Local provider using AES-256-GCM and Ed25519 with secure randomness and zeroization utilities, plus emulated KMS providers (AWS/GCP/Azure/Vault).
- Envelope encryption helper with data-key caching and authenticated encryption.
- High-level helpers (`encryptString`, `encryptJson`, `signPayload`) plus streaming encryption/decryption utilities.
- Config schema validation via `zod` and optional Argon2id or scrypt key derivation.
- Structured audit sinks (console, buffered, composite) and policy guardrails.

## Installation

```bash
npm install @kitiumai/encryption
```

## Quickstart

```ts
import {
  LocalEncryptionProvider,
  encryptString,
  decryptToString,
} from '@kitiumai/encryption';

const provider = new LocalEncryptionProvider();

const encrypted = await encryptString(provider, 'sensitive message', {});
const decrypted = await decryptToString(provider, encrypted);
console.log(decrypted);
```

### Envelope Encryption

```ts
import { EnvelopeEncrypter } from '@kitiumai/encryption';

const provider = new LocalEncryptionProvider();
const envelope = new EnvelopeEncrypter(provider, { dataKeyTtlMs: 120000 });

const wrapped = await envelope.encrypt({ plaintext: Buffer.from('confidential payload') });
const plaintext = await envelope.decrypt(wrapped);
```

### Streaming

```ts
import crypto from 'crypto';
import { createEncryptionStream, createDecryptionStream } from '@kitiumai/encryption';

const key = crypto.randomBytes(32);
const { stream, iv } = createEncryptionStream({ key });
stream.end(Buffer.from('large message body'));

// later, use createDecryptionStream({ key, iv }) to read back
```

## API Reference

- `EncryptionProvider`: encrypt/decrypt/sign/verify; key lifecycle and health.
- `LocalEncryptionProvider`: AES-256-GCM, Ed25519; audit/policy hooks.
- `GenericKmsProvider`: emulates AWS/GCP/Azure/Vault KMS for testing.
- `EnvelopeEncrypter`: data-key wrapping and caching.
- `createEncryptionStream` / `createDecryptionStream`: Transform streams.
- Helpers: `encryptString`, `encryptJson`, `decryptToString`, `decryptJson`, `signPayload`.
- Primitives: `deriveKeyArgon2id`, `deriveKeyScrypt`, `generateNonce`, `constantTimeEqual`, `zeroize`.
- Policy: `PolicyChecker` to enforce allowed keys/algorithms.

## Compliance & Security Defaults

- Authenticated encryption (AES-256-GCM) and Ed25519 signing enabled by default.
- Secure randomness from Node `crypto.randomBytes` and nonce helpers.
- Optional Argon2id or scrypt key derivation with recommended parameters.
- Constant-time comparison and zeroization helpers reduce side-channel risk.
- Configurable FIPS toggle and provider selection via environment variables (`ENCRYPTION_PROVIDER`, `ENCRYPTION_FIPS`).

## Testing

```bash
npm test
```

## Roadmap alignment

This implementation bootstraps the enterprise recommendations with a strict TypeScript toolchain, secure defaults, envelope encryption, streaming support, auditability, and policy enforcement. Providers for AWS/GCP/Azure/Vault can extend the `EncryptionProvider` interface to add remote KMS integrations while preserving the same API surface.
