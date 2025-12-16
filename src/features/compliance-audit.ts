import type { AuditEvent } from '../types.js';

export type ComplianceExportFormat = 'csv' | 'json' | 'parquet';

export type AuditLogFilter = {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  keyId?: string;
  success?: boolean;
  limit?: number;
};

export type ComplianceReport = {
  generatedAt: Date;
  eventCount: number;
  keyIds: string[];
  eventTypes: Set<string>;
  successRate: number;
  suspiciousActivity: AuditEvent[];
};

/**
 * Enhanced audit logging with compliance reporting and event search
 * Phase 1: Comprehensive audit logging for regulatory compliance
 */
export class ComplianceAuditLogger {
  private auditLog: AuditEvent[] = [];
  private readonly maxLogSize: number;

  constructor(maxLogSize = 100000) {
    this.maxLogSize = maxLogSize;
  }

  /**
   * Record an audit event
   */
  record(event: AuditEvent): void {
    this.auditLog.push(event);

    // Maintain max log size with FIFO eviction
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Search audit logs with filters
   */
  searchLogs(filter: AuditLogFilter): AuditEvent[] {
    let results = [...this.auditLog];

    if (filter.startDate) {
      const startDate = filter.startDate;
      results = results.filter((event) => event.timestamp >= startDate);
    }

    if (filter.endDate) {
      const endDate = filter.endDate;
      results = results.filter((event) => event.timestamp <= endDate);
    }

    if (filter.eventType) {
      results = results.filter((event) => event.type === filter.eventType);
    }

    if (filter.keyId) {
      results = results.filter((event) => event.keyId === filter.keyId);
    }

    if (filter.success !== undefined) {
      results = results.filter((event) => event.success === filter.success);
    }

    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(filter?: AuditLogFilter): ComplianceReport {
    const filteredLogs = filter ? this.searchLogs(filter) : this.auditLog;

    const keyIds = new Set<string>();
    const eventTypes = new Set<string>();
    let successCount = 0;

    for (const event of filteredLogs) {
      if (event.keyId) {keyIds.add(event.keyId);}
      eventTypes.add(event.type);
      if (event.success) {successCount += 1;}
    }

    const suspiciousActivity = this.detectSuspiciousActivity(filteredLogs);

    return {
      generatedAt: new Date(),
      eventCount: filteredLogs.length,
      keyIds: Array.from(keyIds),
      eventTypes,
      successRate:
        filteredLogs.length > 0
          ? (successCount / filteredLogs.length) * 100
          : 0,
      suspiciousActivity,
    };
  }

  /**
   * Export audit logs in specified format
   */
  exportLogs(
    filter: AuditLogFilter,
    format: ComplianceExportFormat = 'json'
  ): string {
    const logs = this.searchLogs(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'csv': {
        if (logs.length === 0) {return '';}
        const headers = [
          'timestamp',
          'type',
          'provider',
          'keyId',
          'success',
          'correlationId',
          'metadata',
        ];
        const rows = logs.map((event) => [
          event.timestamp.toISOString(),
          event.type,
          event.provider,
          event.keyId ?? '',
          event.success ? 'true' : 'false',
          event.correlationId ?? '',
          JSON.stringify(event.metadata ?? {}),
        ]);

        return [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
      }

      case 'parquet':
        // Placeholder for parquet export (requires external library)
        throw new Error(
          'Parquet export requires additional dependencies. Use JSON or CSV instead.'
        );

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(logs: AuditEvent[]): AuditEvent[] {
    const suspicious: AuditEvent[] = [];
    const failuresByKey = new Map<string, number>();

    for (const event of logs) {
      if (!event.success && event.keyId) {
        const count = (failuresByKey.get(event.keyId) ?? 0) + 1;
        failuresByKey.set(event.keyId, count);

        // Flag if more than 5 consecutive failures
        if (count > 5) {
          suspicious.push(event);
        }
      }
    }

    return suspicious;
  }

  /**
   * Clear audit logs (with caution)
   */
  clear(): void {
    this.auditLog = [];
  }

  /**
   * Get total audit log entries
   */
  getLogCount(): number {
    return this.auditLog.length;
  }
}
