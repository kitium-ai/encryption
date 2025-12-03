import { PolicyViolationError } from '../errors.js';

export interface PolicyRule {
  action: 'encrypt' | 'decrypt' | 'sign' | 'verify';
  allowedKeyIds?: string[];
  allowedAlgorithms?: string[];
  maxAgeMs?: number;
}

export class PolicyChecker {
  constructor(private readonly rules: PolicyRule[] = []) {}

  enforce(
    action: PolicyRule['action'],
    context: { keyId?: string; algorithm?: string; createdAt?: Date }
  ) {
    for (const rule of this.rules) {
      if (rule.action !== action) {
        continue;
      }
      if (rule.allowedKeyIds && context.keyId && !rule.allowedKeyIds.includes(context.keyId)) {
        throw new PolicyViolationError(`Key ${context.keyId} is not allowed for ${action}`);
      }
      if (
        rule.allowedAlgorithms &&
        context.algorithm &&
        !rule.allowedAlgorithms.includes(context.algorithm)
      ) {
        throw new PolicyViolationError(`Algorithm ${context.algorithm} not allowed for ${action}`);
      }
      if (rule.maxAgeMs && context.createdAt) {
        const age = Date.now() - context.createdAt.getTime();
        if (age > rule.maxAgeMs) {
          throw new PolicyViolationError(`Key expired for ${action}`);
        }
      }
    }
  }
}
