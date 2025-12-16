import type { AuditEvent } from '../types.js';

export type ThreatDetectionConfig = {
  failureThreshold: number; // Failures before alert
  timeWindowSeconds: number; // Time window for counting failures
  enableAnomalyDetection: boolean;
};

export type ThreatAlert = {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  relatedEvents: AuditEvent[];
  detectedAt: Date;
  resolved: boolean;
};

/**
 * Threat detection and anomaly analysis
 * Phase 2: Threat detection with configurable alerts
 */
export class ThreatDetectionEngine {
  private readonly alerts: Map<string, ThreatAlert> = new Map();
  private readonly failurePatterns: Map<string, Date[]> = new Map(); // keyId -> timestamps

  constructor(private readonly config: ThreatDetectionConfig) {}

  /**
   * Analyze audit event for threats
   */
  analyzeEvent(event: AuditEvent): ThreatAlert | null {
    if (!event.success && event.keyId) {
      return this.detectFailurePattern(event);
    }

    if (this.config.enableAnomalyDetection) {
      return this.detectAnomalies(event);
    }

    return null;
  }

  /**
   * Detect repeated failure patterns
   */
  private detectFailurePattern(event: AuditEvent): ThreatAlert | null {
    const keyId = event.keyId!;
    const now = Date.now();
    const windowMs = this.config.timeWindowSeconds * 1000;

    if (!this.failurePatterns.has(keyId)) {
      this.failurePatterns.set(keyId, []);
    }

    const timestamps = this.failurePatterns.get(keyId)!;

    // Remove old timestamps outside window
    const recentTimestamps = timestamps.filter(
      (ts) => now - ts.getTime() < windowMs
    );

    recentTimestamps.push(event.timestamp);
    this.failurePatterns.set(keyId, recentTimestamps);

    if (recentTimestamps.length >= this.config.failureThreshold) {
      return {
        id: `threat_${Date.now()}_${Math.random()}`,
        severity: 'high',
        type: 'repeated_failures',
        message: `Key ${keyId} has ${recentTimestamps.length} failures in ${this.config.timeWindowSeconds}s`,
        relatedEvents: [event],
        detectedAt: new Date(),
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Detect unusual access patterns
   */
  private detectAnomalies(event: AuditEvent): ThreatAlert | null {
    // Detect rapid successive operations
    if (
      event.type === 'decrypt' ||
      event.type === 'encrypt'
    ) {
      return null; // Implement time-based anomaly detection
    }

    return null;
  }

  /**
   * Record a detected threat
   */
  recordThreat(alert: ThreatAlert): void {
    this.alerts.set(alert.id, alert);
  }

  /**
   * Get threat by ID
   */
  getThreat(threatId: string): ThreatAlert | undefined {
    return this.alerts.get(threatId);
  }

  /**
   * Get all active threats
   */
  getActiveThreats(): ThreatAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get threats by severity
   */
  getThreatsBySeverity(severity: ThreatAlert['severity']): ThreatAlert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.severity === severity && !alert.resolved
    );
  }

  /**
   * Resolve a threat
   */
  resolveThreat(threatId: string): void {
    const alert = this.alerts.get(threatId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get threat summary
   */
  getThreatSummary(): Record<string, number> {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
    };

    for (const alert of this.alerts.values()) {
      if (alert.resolved) {
        summary.resolved += 1;
      } else {
        summary[alert.severity] += 1;
      }
    }

    return summary;
  }

  /**
   * Clear resolved threats (maintenance)
   */
  clearResolvedThreats(): number {
    let count = 0;
    for (const [id, alert] of this.alerts) {
      if (alert.resolved) {
        this.alerts.delete(id);
        count += 1;
      }
    }

    return count;
  }
}
