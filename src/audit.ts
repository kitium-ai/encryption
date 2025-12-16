import { AuditSinkError } from './errors.js';
import type { AuditEvent } from './types.js';

export type AuditSink = {
  record(event: AuditEvent): Promise<void>;
}

export class ConsoleAuditSink implements AuditSink {
  record(event: AuditEvent): Promise<void> {

    return Promise.resolve(console.info(JSON.stringify({ level: 'info', ...event })));
  }
}

export class BufferedAuditSink implements AuditSink {
  private readonly events: AuditEvent[] = [];

  record(event: AuditEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
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
        } catch (error) {
          errors.push(error as Error);
        }
      })
    );
    if (errors.length > 0) {
      throw new AuditSinkError(`Audit sink failures: ${errors.map((error_) => error_.message).join(', ')}`);
    }
  }
}
