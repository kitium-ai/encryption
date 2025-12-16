import { describe, it, expect, beforeEach } from 'vitest';
import { ThreatDetectionEngine } from '../src/features/threat-detection.js';
import type { AuditEvent } from '../src/types.js';

describe('ThreatDetectionEngine', () => {
  let engine: ThreatDetectionEngine;

  beforeEach(() => {
    engine = new ThreatDetectionEngine({
      failureThreshold: 3,
      timeWindowSeconds: 60,
      enableAnomalyDetection: true,
    });
  });

  it('detects failure patterns', () => {
    const event: AuditEvent = {
      type: 'decrypt',
      provider: 'local',
      keyId: 'test-key',
      timestamp: new Date(),
      success: false,
    };

    let alert = engine.analyzeEvent(event);
    expect(alert).toBeNull(); // First failure

    alert = engine.analyzeEvent(event);
    expect(alert).toBeNull(); // Second failure

    alert = engine.analyzeEvent(event);
    expect(alert).not.toBeNull(); // Third failure triggers alert
    expect(alert?.severity).toBe('high');
  });

  it('records threats', () => {
    const threat = {
      id: 'threat-1',
      severity: 'critical' as const,
      type: 'unauthorized_access',
      message: 'Unauthorized access detected',
      relatedEvents: [],
      detectedAt: new Date(),
      resolved: false,
    };

    engine.recordThreat(threat);
    const retrieved = engine.getThreat('threat-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.severity).toBe('critical');
  });

  it('gets active threats', () => {
    const threat = {
      id: 'threat-1',
      severity: 'high' as const,
      type: 'repeated_failures',
      message: 'Multiple failures detected',
      relatedEvents: [],
      detectedAt: new Date(),
      resolved: false,
    };

    engine.recordThreat(threat);
    const active = engine.getActiveThreats();
    expect(active.length).toBe(1);
  });

  it('filters threats by severity', () => {
    const criticalThreat = {
      id: 'threat-1',
      severity: 'critical' as const,
      type: 'critical_event',
      message: 'Critical threat',
      relatedEvents: [],
      detectedAt: new Date(),
      resolved: false,
    };

    const lowThreat = {
      id: 'threat-2',
      severity: 'low' as const,
      type: 'suspicious_activity',
      message: 'Low severity threat',
      relatedEvents: [],
      detectedAt: new Date(),
      resolved: false,
    };

    engine.recordThreat(criticalThreat);
    engine.recordThreat(lowThreat);

    const critical = engine.getThreatsBySeverity('critical');
    expect(critical.length).toBe(1);
    expect(critical[0].severity).toBe('critical');
  });

  it('resolves threats', () => {
    const threat = {
      id: 'threat-1',
      severity: 'high' as const,
      type: 'test',
      message: 'Test threat',
      relatedEvents: [],
      detectedAt: new Date(),
      resolved: false,
    };

    engine.recordThreat(threat);
    engine.resolveThreat('threat-1');

    const active = engine.getActiveThreats();
    expect(active.length).toBe(0);
  });

  it('generates threat summary', () => {
    const threats = [
      {
        id: 'threat-1',
        severity: 'critical' as const,
        type: 'critical',
        message: 'Critical',
        relatedEvents: [],
        detectedAt: new Date(),
        resolved: false,
      },
      {
        id: 'threat-2',
        severity: 'high' as const,
        type: 'high',
        message: 'High',
        relatedEvents: [],
        detectedAt: new Date(),
        resolved: false,
      },
    ];

    threats.forEach((t) => engine.recordThreat(t));
    const summary = engine.getThreatSummary();

    expect(summary.critical).toBe(1);
    expect(summary.high).toBe(1);
  });
});
