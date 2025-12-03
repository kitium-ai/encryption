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
  EnvelopeEncrypter,
  createEncryptionStream,
  createDecryptionStream,
  loadConfig,
} from '@kitiumai/encryption';
import crypto from 'crypto';

const config = loadConfig();
const provider = new LocalEncryptionProvider({ defaultEncryptionKeyId: config.defaultKeyId });

const encrypted = await encryptString(provider, 'sensitive message', {});
const decrypted = await decryptToString(provider, encrypted);
console.log(decrypted);

// Envelope encryption with cached data keys
const envelope = new EnvelopeEncrypter(provider, { dataKeyTtlMs: 120000 });
const wrapped = await envelope.encrypt({ plaintext: Buffer.from('confidential payload') });
const plaintext = await envelope.decrypt(wrapped);

// Streaming example
const key = crypto.randomBytes(32);
const { stream, iv } = createEncryptionStream({ key });
stream.end(Buffer.from('large message body'));
```

## API Reference
- `EncryptionProvider`: interface for encrypt/decrypt/sign/verify/key lifecycle.
- `LocalEncryptionProvider`: Node/WebCrypto backed provider with audit and policy hooks.
- `GenericKmsProvider`: Emulated providers for AWS KMS, Google Cloud KMS, Azure Key Vault, and Vault Transit for testing and multi-provider ergonomics.
- `LocalEncryptionProvider`: Node/WebCrypto backed provider with audit and policy hooks.
- `EnvelopeEncrypter`: envelope encryption with data-key wrapping and caching.
- `createEncryptionStream` / `createDecryptionStream`: Transform streams for large payloads.
- `encryptString`, `encryptJson`, `decryptToString`, `decryptJson`, `signPayload`: ergonomic helpers.
- `deriveKeyArgon2id`, `deriveKeyScrypt`, `generateNonce`, `constantTimeEqual`, `zeroize`: primitives for secure key handling.
- `ConsoleAuditSink`, `BufferedAuditSink`, `CompositeAuditSink`: structured audit emission.
- `PolicyChecker`: enforce allowed key/algorithm usage with actionable errors.

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
