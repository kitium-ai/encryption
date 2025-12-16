import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceAuditLogger } from '../src/features/compliance-audit.js';
import type { AuditEvent } from '../src/types.js';

describe('ComplianceAuditLogger', () => {
  let logger: ComplianceAuditLogger;

  beforeEach(() => {
    logger = new ComplianceAuditLogger(1000);
  });

  it('records audit events', () => {
    const event: AuditEvent = {
      type: 'encrypt',
      provider: 'local',
      keyId: 'test-key',
      timestamp: new Date(),
      success: true,
    };

    logger.record(event);
    expect(logger.getLogCount()).toBe(1);
  });

  it('searches logs by event type', () => {
    const event1: AuditEvent = {
      type: 'encrypt',
      provider: 'local',
      timestamp: new Date(),
      success: true,
    };

    const event2: AuditEvent = {
      type: 'decrypt',
      provider: 'local',
      timestamp: new Date(),
      success: true,
    };

    logger.record(event1);
    logger.record(event2);

    const encrypted = logger.searchLogs({ eventType: 'encrypt' });
    expect(encrypted.length).toBe(1);
    expect(encrypted[0].type).toBe('encrypt');
  });

  it('generates compliance report', () => {
    const event: AuditEvent = {
      type: 'encrypt',
      provider: 'local',
      keyId: 'test-key',
      timestamp: new Date(),
      success: true,
    };

    logger.record(event);
    const report = logger.generateComplianceReport();

    expect(report.eventCount).toBe(1);
    expect(report.successRate).toBe(100);
    expect(report.keyIds).toContain('test-key');
  });

  it('exports logs to JSON format', () => {
    const event: AuditEvent = {
      type: 'encrypt',
      provider: 'local',
      timestamp: new Date(),
      success: true,
    };

    logger.record(event);
    const json = logger.exportLogs({}, 'json');

    expect(json).toContain('encrypt');
    expect(json).toContain('local');
  });

  it('exports logs to CSV format', () => {
    const event: AuditEvent = {
      type: 'encrypt',
      provider: 'local',
      timestamp: new Date(),
      success: true,
    };

    logger.record(event);
    const csv = logger.exportLogs({}, 'csv');

    expect(csv).toContain('timestamp');
    expect(csv).toContain('encrypt');
  });
});
