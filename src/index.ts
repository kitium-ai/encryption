// Core types and interfaces
export * from './interfaces/adapter.js';
export * from './interfaces/core.js';
export * from './types.js';

// Providers
export * from './providers/base.js';
export * from './providers/genericKms.js';
export * from './providers/hsm.js';
export * from './providers/local/index.js';

// Strategies
export * from './strategies/aes-gcm.js';
export * from './strategies/algorithm.js';
export * from './strategies/ed25519.js';
export * from './strategies/registry.js';

// Decorators
export * from './decorators/audit.js';
export * from './decorators/base.js';
export * from './decorators/circuit-breaker.js';
export * from './decorators/metrics.js';
export * from './decorators/policy.js';
export * from './decorators/retry.js';

// Factory
export * from './factory/provider-factory.js';

// Utilities
export * from './utils/checksum.js';
export * from './utils/context.js';
export * from './utils/crypto.js';
export * from './utils/lru-cache.js';
export * from './utils/policy.js';

// Features
export * from './audit.js';
export * from './config/schema.js';
export * from './envelope.js';
export * from './errors.js';
export * from './helpers.js';
export * from './streaming.js';

// Phase 1: Core enterprise features
export * from './features/compliance-audit.js';
export * from './features/key-rotation.js';
export * from './features/soft-delete.js';

// Phase 2: Advanced security features
export * from './features/jit-access.js';
export * from './features/network-security.js';
export * from './features/threat-detection.js';

// Phase 3: High availability and future-proofing
export * from './features/backup-recovery.js';
export * from './features/external-kms.js';
export * from './features/multi-region.js';
export * from './features/post-quantum.js';
