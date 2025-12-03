import { AuditEvent } from './types.js';
import { AuditSinkError } from './errors.js';

export interface AuditSink {
  record(event: AuditEvent): Promise<void>;
}

export class ConsoleAuditSink implements AuditSink {
  async record(event: AuditEvent): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(JSON.stringify({ level: 'info', ...event }));
  }
}

export class BufferedAuditSink implements AuditSink {
  private readonly events: AuditEvent[] = [];

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  flush(): AuditEvent[] {
    return [...this.events];
  }
}

export class CompositeAuditSink implements AuditSink {
  constructor(private readonly sinks: AuditSink[]) {}

  async record(event: AuditEvent): Promise<void> {
    const errors: Error[] = [];
    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.record(event);
        } catch (err) {
          errors.push(err as Error);
        }
      })
    );
    if (errors.length > 0) {
      throw new AuditSinkError(`Audit sink failures: ${errors.map((e) => e.message).join(', ')}`);
    }
  }
}
