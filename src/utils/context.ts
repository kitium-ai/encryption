import crypto from 'node:crypto';

/**
 * Operation context for correlation tracking
 * Allows tracing operations across system boundaries
 */
export type OperationContext = {
  correlationId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Context manager for threading correlation IDs and metadata through operations
 * Useful for distributed tracing and debugging
 */
export class ContextManager {
  private static readonly contexts = new Map<string, OperationContext>();

  /**
   * Create a new operation context
   */
  static create(
    correlationId?: string,
    metadata?: Record<string, unknown>
  ): OperationContext {
    const context: OperationContext = {
      correlationId: correlationId ?? crypto.randomUUID(),
      metadata,
      timestamp: new Date(),
    };

    this.contexts.set(context.correlationId, context);
    return context;
  }

  /**
   * Get an existing operation context
   */
  static get(correlationId: string): OperationContext | undefined {
    return this.contexts.get(correlationId);
  }

  /**
   * Delete an operation context
   */
  static delete(correlationId: string): void {
    this.contexts.delete(correlationId);
  }

  /**
   * Get all active contexts (useful for debugging)
   */
  static getAllContexts(): ReadonlyMap<string, OperationContext> {
    return new Map(this.contexts);
  }

  /**
   * Clear all contexts
   */
  static clearAll(): void {
    this.contexts.clear();
  }
}
