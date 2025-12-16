# @kitiumai/encryption

Enterprise-ready TypeScript encryption SDK with pluggable providers, secure defaults, and ergonomic APIs inspired by major cloud KMS offerings.

## What is @kitiumai/encryption?

**@kitiumai/encryption** is a comprehensive, production-ready encryption SDK designed for modern TypeScript applications. It provides secure cryptographic operations, key management, audit logging, compliance reporting, and cloud-native integrations in a single, lightweight package.

Built with enterprise security requirements in mind, it bridges the gap between developer-friendly APIs and the robust security features found in major cloud KMS services like AWS KMS, Azure Key Vault, and HashiCorp Vault.

## Why Do We Need This Package?

In today's security-conscious development landscape, applications need more than basic encryption. They require:

- **Enterprise-grade security** with FIPS-compliant algorithms and audited implementations
- **Key lifecycle management** with automatic rotation, backup, and recovery
- **Compliance and audit trails** for regulatory requirements (SOC 2, HIPAA, PCI DSS)
- **Multi-cloud portability** with consistent APIs across different KMS providers
- **Developer experience** with TypeScript-first design and comprehensive tooling

Traditional crypto libraries provide low-level primitives but leave developers to implement security best practices themselves. Cloud KMS services offer enterprise features but lock you into specific vendors. **@kitiumai/encryption** provides the best of both worlds: enterprise security features with the flexibility of open-source software.

## Competitor Comparison

| Feature | @kitiumai/encryption | AWS KMS | Azure Key Vault | GCP Cloud KMS | HashiCorp Vault | node:crypto |
|---------|---------------------|---------|----------------|----------------|-----------------|-------------|
| **TypeScript Native** | ✅ Full TS support | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FIPS Compliance** | ✅ FIPS 140-3 ready | ✅ FIPS 140-2 L3 | ✅ FIPS 140-2 L2+ | ✅ FIPS 140-2 L3 | ✅ FIPS 140-2 L2 | ❌ |
| **Key Rotation** | ✅ Automatic + Manual | ✅ Automatic | ✅ Automatic | ✅ Automatic | ✅ Manual | ❌ |
| **Audit Logging** | ✅ Structured + Export | ✅ CloudTrail | ✅ Activity logs | ✅ Cloud Audit | ✅ Audit logs | ❌ |
| **Multi-Region** | ✅ Built-in replication | ✅ Multi-region | ✅ Geo-redundant | ✅ Multi-region | ❌ | ❌ |
| **HSM Support** | ✅ PKCS#11 interface | ✅ CloudHSM | ✅ Managed HSM | ✅ Cloud HSM | ✅ | ❌ |
| **Post-Quantum Crypto** | ✅ ML-KEM/ML-DSA | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Envelope Encryption** | ✅ Built-in | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Soft Delete** | ✅ Configurable retention | ✅ 7-30 days | ✅ 7-90 days | ✅ 7-30 days | ❌ | ❌ |
| **JIT Access Control** | ✅ Approval workflows | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Threat Detection** | ✅ Anomaly detection | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Backup/Recovery** | ✅ Encrypted backups | ✅ | ✅ | ✅ | ✅ | ❌ |
| **External KMS** | ✅ PKCS#11 abstraction | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Open Source** | ✅ MIT License | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Self-Hosted** | ✅ No vendor lock-in | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Cost** | Free | Pay-per-use | Pay-per-use | Pay-per-use | Free (self-hosted) | Free |

## Unique Selling Proposition (USP)

**"Enterprise Security Without Enterprise Complexity"**

Unlike cloud vendor KMS services that lock you into specific platforms, **@kitiumai/encryption** gives you:

- **Freedom**: Self-hosted with no vendor lock-in or usage costs
- **Standards**: FIPS-compliant implementations ready for regulated industries
- **Future-Proof**: Post-quantum cryptography support for quantum-resistant security
- **Developer-First**: Native TypeScript with excellent DX and comprehensive tooling
- **Enterprise Features**: All the security capabilities of major cloud KMS without the complexity
- **Compliance-Ready**: Built-in audit logging and compliance reporting for SOC 2, HIPAA, PCI DSS

## Features

- **Core Cryptography**: AES-256-GCM, ChaCha20-Poly1305, Ed25519, ECDSA, RSA-OAEP, ML-KEM, ML-DSA
- **Key Management**: Generation, rotation, lifecycle management, and metadata tracking
- **Envelope Encryption**: Data-key wrapping with automatic key caching and rotation
- **Provider Abstraction**: Pluggable providers for local, AWS KMS, Azure Key Vault, GCP KMS, Vault, HSM
- **Audit & Compliance**: Structured audit logging with CSV/JSON/Parquet exports
- **Security Features**: Soft delete, JIT access control, threat detection, network security
- **High Availability**: Multi-region replication with automatic failover
- **Backup & Recovery**: Encrypted backups with integrity verification
- **Post-Quantum**: ML-KEM key encapsulation and ML-DSA signatures
- **Streaming**: Transform streams for large file encryption/decryption
- **Policy Engine**: Configurable security policies and guardrails

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

### Core Types

#### `Algorithm`
Supported cryptographic algorithms:
```ts
type Algorithm =
  | 'AES-256-GCM'
  | 'CHACHA20-POLY1305'
  | 'ED25519'
  | 'ECDSA-P256'
  | 'RSA-OAEP-256'
  | 'ML-KEM'
  | 'ML-DSA'
  | 'SLH-DSA';
```

#### `EncryptionRequest` / `EncryptionResult`
```ts
interface EncryptionRequest {
  plaintext: Uint8Array;
  additionalData?: Uint8Array;
  keyId?: string;
  algorithm?: Algorithm;
  abortSignal?: AbortSignal;
}

interface EncryptionResult {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag?: Uint8Array;
  keyId: string;
  algorithm: Algorithm;
  additionalData?: Uint8Array;
}
```

#### `KeyMetadata`
```ts
interface KeyMetadata {
  keyId: string;
  algorithm: Algorithm;
  createdAt: Date;
  expiresAt?: Date;
  version?: string;
  managedBy: 'local' | 'aws-kms' | 'gcp-kms' | 'azure-keyvault' | 'vault-transit' | 'hsm' | 'external-kms';
  labels?: Record<string, string>;
}
```

### Core Classes

#### `EncryptionProvider`
Base interface for all encryption operations.

```ts
interface EncryptionProvider {
  encrypt(request: EncryptionRequest): Promise<EncryptionResult>;
  decrypt(request: DecryptionRequest): Promise<Uint8Array>;
  sign(request: SignatureRequest): Promise<SignatureResult>;
  verify(request: VerificationRequest): Promise<boolean>;
  generateKey(algorithm: Algorithm, labels?: Record<string, string>): Promise<KeyMetadata>;
  getKeyMetadata(keyId: string): Promise<KeyMetadata>;
  listKeys(): Promise<KeyMetadata[]>;
  healthCheck(): Promise<HealthCheck>;
}
```

#### `LocalEncryptionProvider`
Local provider using Node.js crypto with secure defaults.

```ts
import { LocalEncryptionProvider } from '@kitiumai/encryption';

const provider = new LocalEncryptionProvider({
  fipsMode: true, // Enable FIPS-compliant algorithms
  auditSink: new ConsoleAuditSink()
});
```

#### `GenericKmsProvider`
Emulates cloud KMS providers for testing.

```ts
import { GenericKmsProvider } from '@kitiumai/encryption';

const provider = new GenericKmsProvider('aws-kms', {
  region: 'us-east-1',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret'
});
```

### Phase 1: Core Enterprise Features

#### `KeyRotationManager`
Automatic key rotation with configurable policies.

```ts
import { KeyRotationManager, KeyRotationPolicy } from '@kitiumai/encryption';

const manager = new KeyRotationManager(provider);
const policy: KeyRotationPolicy = {
  autoRotateEnabled: true,
  rotationIntervalDays: 90,
  rotationWindowDays: 7
};

await manager.initializeKeyRotation('key-123', policy);
const shouldRotate = manager.shouldRotate('key-123');
if (shouldRotate) {
  await manager.rotateKey('key-123');
}
```

#### `ComplianceAuditLogger`
Structured audit logging with compliance exports.

```ts
import { ComplianceAuditLogger, ComplianceExportFormat } from '@kitiumai/encryption';

const logger = new ComplianceAuditLogger(100000); // Max log size

// Record events
logger.record({
  type: 'encrypt',
  provider: 'local',
  keyId: 'key-123',
  timestamp: new Date(),
  success: true
});

// Export for compliance
const csvReport = await logger.exportLogs('csv', {
  startDate: new Date('2024-01-01'),
  eventType: 'encrypt'
});
```

#### `KeySoftDeleteManager`
Recoverable key deletion with retention policies.

```ts
import { KeySoftDeleteManager } from '@kitiumai/encryption';

const manager = new KeySoftDeleteManager(provider, {
  retentionDays: 30,
  purgeProtection: true
});

// Soft delete (recoverable)
await manager.softDeleteKey('key-123');

// Restore if needed
await manager.restoreKey('key-123');

// Permanent deletion after retention period
await manager.purgeKey('key-123');
```

### Phase 2: Advanced Enterprise Features

#### `HSMProvider`
Hardware Security Module integration via PKCS#11.

```ts
import { HSMProvider } from '@kitiumai/encryption';

const provider = new HSMProvider({
  pkcs11LibPath: '/usr/lib/pkcs11/libsofthsm2.so',
  slotId: 0,
  pin: '1234'
});
```

#### `MultiRegionKeyManager`
Multi-region key replication with automatic failover.

```ts
import { MultiRegionKeyManager } from '@kitiumai/encryption';

const manager = new MultiRegionKeyManager(provider, {
  primaryRegion: 'us-east-1',
  replicaRegions: ['us-west-2', 'eu-west-1'],
  replicationFactor: 3
});

// Replicate key across regions
const isReplicated = await manager.replicateKeyToAllRegions('key-123');

// Check replication status
const status = await manager.getReplicationStatus('key-123');

// Promote region during failover
await manager.promoteRegion('us-west-2');
```

#### `JITAccessManager`
Just-in-time privileged access with approval workflows.

```ts
import { JITAccessManager } from '@kitiumai/encryption';

const manager = new JITAccessManager({
  maxExpiryHours: 8,
  requireApproval: true,
  approvers: ['admin@company.com']
});

// Request temporary access
const requestId = await manager.requestAccess({
  keyId: 'sensitive-key',
  action: 'decrypt',
  durationHours: 2,
  justification: 'Emergency database maintenance'
});

// Approve request (admin only)
await manager.approveRequest(requestId, 'admin@company.com');

// Use approved access
const hasAccess = await manager.checkAccess('user@company.com', 'sensitive-key', 'decrypt');
```

#### `NetworkSecurityManager`
Network access controls and firewall rules.

```ts
import { NetworkSecurityManager } from '@kitiumai/encryption';

const manager = new NetworkSecurityManager();

// Add firewall rules
manager.addFirewallRule({
  name: 'office-only',
  action: 'allow',
  sourceIPs: ['192.168.1.0/24'],
  ports: [443],
  protocols: ['tcp']
});

// Add private endpoint policy
manager.addPrivateEndpointPolicy({
  vnetId: 'vnet-123',
  subnetId: 'subnet-456',
  enforcePrivateLink: true
});

// Evaluate access
const allowed = await manager.evaluateAccess({
  sourceIP: '192.168.1.100',
  port: 443,
  protocol: 'tcp',
  keyId: 'key-123'
});
```

### Phase 3: Advanced Security & Future-Proofing

#### `PostQuantumProvider`
Post-quantum cryptography with ML-KEM and ML-DSA.

```ts
import { PostQuantumProvider } from '@kitiumai/encryption';

const provider = new PostQuantumProvider();

// Generate ML-KEM key pair for key encapsulation
const kemKeyPair = await provider.generateMLKEMKeyPair();

// Encapsulate shared secret
const { ciphertext, sharedSecret } = await provider.mlkemEncapsulate(kemKeyPair.publicKey);

// Generate ML-DSA key pair for signatures
const dsaKeyPair = await provider.generateMLDSASignature();

// Sign message
const signature = await provider.mldsaSign(sharedSecret, dsaKeyPair.privateKey);

// Verify signature
const isValid = await provider.mldsaVerify(signature, sharedSecret, dsaKeyPair.publicKey);
```

#### `BackupRecoveryManager`
Encrypted backup and recovery with integrity verification.

```ts
import { BackupRecoveryManager } from '@kitiumai/encryption';

const manager = new BackupRecoveryManager('./backups', {
  retentionDays: 365,
  encryptionKey: crypto.randomBytes(32),
  compressionEnabled: true
});

// Create encrypted backup
const backupId = await manager.createBackup(['key-1', 'key-2', 'key-3']);

// List available backups
const backups = await manager.listBackups();

// Restore from backup
await manager.restoreFromBackup(backupId);

// Verify backup integrity
const isValid = await manager.verifyBackupIntegrity(backupId);
```

#### `ExternalKeyStoreManager`
Integration with external key management systems.

```ts
import { ExternalKeyStoreManager } from '@kitiumai/encryption';

const manager = new ExternalKeyStoreManager({
  endpoint: 'https://external-kms.company.com',
  apiKey: process.env.EXTERNAL_KMS_API_KEY,
  tlsConfig: {
    caCertificate: fs.readFileSync('./ca-cert.pem'),
    clientCertificate: fs.readFileSync('./client-cert.pem'),
    clientKey: fs.readFileSync('./client-key.pem')
  },
  cacheConfig: {
    ttlMs: 300000, // 5 minutes
    maxSize: 100
  }
});

// Delegate cryptographic operations to external KMS
const encrypted = await manager.encryptWithExternal({
  plaintext: Buffer.from('sensitive data'),
  keyId: 'external-key-123'
});
```

#### `ThreatDetectionEngine`
Real-time anomaly detection and threat alerting.

```ts
import { ThreatDetectionEngine } from '@kitiumai/encryption';

const engine = new ThreatDetectionEngine({
  failureRateThreshold: 0.1, // 10% failure rate
  unusualAccessPatterns: true,
  geoBlocking: ['blocked-country-1', 'blocked-country-2'],
  alertHandlers: [
    (alert) => console.log(`Security Alert: ${alert.type}`),
    (alert) => sendEmailAlert(alert)
  ]
});

// Monitor operations
await engine.recordOperation({
  type: 'decrypt',
  keyId: 'key-123',
  success: false,
  sourceIP: '192.168.1.100',
  userAgent: 'suspicious-client'
});

// Check for anomalies
const anomalies = await engine.detectAnomalies();
```

### Utilities & Helpers

#### High-Level Helpers
```ts
import {
  encryptString,
  decryptToString,
  encryptJson,
  decryptJson,
  signPayload
} from '@kitiumai/encryption';

// String encryption
const encrypted = await encryptString(provider, 'hello world');
const decrypted = await decryptToString(provider, encrypted);

// JSON encryption
const encryptedJson = await encryptJson(provider, { apiKey: 'secret', dbPass: 'password' });
const decryptedJson = await decryptJson(provider, encryptedJson);

// Payload signing
const signature = await signPayload(provider, Buffer.from('data to sign'));
```

#### Streaming Encryption
```ts
import { createEncryptionStream, createDecryptionStream } from '@kitiumai/encryption';

const key = crypto.randomBytes(32);
const { stream: encryptStream, iv } = createEncryptionStream({ key });

// Encrypt large file
fs.createReadStream('large-file.txt')
  .pipe(encryptStream)
  .pipe(fs.createWriteStream('large-file.enc'));

// Decrypt later
const decryptStream = createDecryptionStream({ key, iv });
fs.createReadStream('large-file.enc')
  .pipe(decryptStream)
  .pipe(fs.createWriteStream('large-file.txt'));
```

#### Key Derivation
```ts
import { deriveKeyArgon2id, deriveKeyScrypt } from '@kitiumai/encryption';

// Argon2id key derivation (recommended)
const key1 = await deriveKeyArgon2id('password', 'salt', {
  parallelism: 1,
  iterations: 2,
  memorySize: 19456
});

// Scrypt key derivation
const key2 = await deriveKeyScrypt('password', 'salt', {
  N: 16384,
  r: 8,
  p: 1
});
```

#### Security Primitives
```ts
import {
  generateNonce,
  constantTimeEqual,
  zeroize
} from '@kitiumai/encryption';

// Generate cryptographically secure nonce
const nonce = generateNonce(16);

// Constant-time comparison to prevent timing attacks
const isEqual = constantTimeEqual(buffer1, buffer2);

// Securely zeroize sensitive data
zeroize(secretBuffer);
```

## Compliance & Security Defaults

- **Authenticated encryption** (AES-256-GCM) and Ed25519 signing enabled by default
- **Secure randomness** from Node `crypto.randomBytes` and nonce helpers
- **Optional Argon2id or scrypt** key derivation with recommended parameters
- **Constant-time comparison** and zeroization helpers reduce side-channel risk
- **Configurable FIPS toggle** and provider selection via environment variables (`ENCRYPTION_PROVIDER`, `ENCRYPTION_FIPS`)

## Testing

```bash
npm test
```

## Roadmap Alignment

This implementation bootstraps the enterprise recommendations with a strict TypeScript toolchain, secure defaults, envelope encryption, streaming support, auditability, and policy enforcement. Providers for AWS/GCP/Azure/Vault can extend the `EncryptionProvider` interface to add remote KMS integrations while preserving the same API surface.

## Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## License

MIT
