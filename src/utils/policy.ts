import { PolicyViolationError } from '../errors.js';

export type PolicyRule = {
  action: 'encrypt' | 'decrypt' | 'sign' | 'verify';
  allowedKeyIds?: string[];
  allowedAlgorithms?: string[];
  maxAgeMs?: number;
};

export class PolicyChecker {
  constructor(private readonly rules: PolicyRule[] = []) {}

  private enforceAllowedKeyIds(rule: PolicyRule, context: { keyId?: string }, action: string): void {
    if (!rule.allowedKeyIds || !context.keyId) {return;}
    if (!rule.allowedKeyIds.includes(context.keyId)) {
      throw new PolicyViolationError(`Key ${context.keyId} is not allowed for ${action}`);
    }
  }

  private enforceAllowedAlgorithms(
    rule: PolicyRule,
    context: { algorithm?: string },
    action: string
  ): void {
    if (!rule.allowedAlgorithms || !context.algorithm) {return;}
    if (!rule.allowedAlgorithms.includes(context.algorithm)) {
      throw new PolicyViolationError(`Algorithm ${context.algorithm} not allowed for ${action}`);
    }
  }

  private enforceMaxAge(
    rule: PolicyRule,
    context: { createdAt?: Date },
    action: string
  ): void {
    if (!rule.maxAgeMs || !context.createdAt) {return;}
    const ageMs = Date.now() - context.createdAt.getTime();
    if (ageMs > rule.maxAgeMs) {
      throw new PolicyViolationError(`Key expired for ${action}`);
    }
  }

  enforce(
    action: PolicyRule['action'],
    context: { keyId?: string; algorithm?: string; createdAt?: Date }
  ): void {
    for (const rule of this.rules) {
      if (rule.action !== action) {
        continue;
      }
      this.enforceAllowedKeyIds(rule, context, action);
      this.enforceAllowedAlgorithms(rule, context, action);
      this.enforceMaxAge(rule, context, action);
    }
  }
}
