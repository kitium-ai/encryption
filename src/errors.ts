export class EncryptionError extends Error {
  readonly code: string;

  constructor(message: string, code = 'ENCRYPTION_ERROR') {
    super(message);
    this.code = code;
  }
}

export class PolicyViolationError extends Error {
  readonly code = 'POLICY_VIOLATION';

  constructor(message: string) {
    super(message);
  }
}

export class UnsupportedAlgorithmError extends Error {
  readonly code = 'UNSUPPORTED_ALGORITHM';

  constructor(message: string) {
    super(message);
  }
}

export class AuditSinkError extends Error {
  readonly code = 'AUDIT_SINK_ERROR';

  constructor(message: string) {
    super(message);
  }
}
