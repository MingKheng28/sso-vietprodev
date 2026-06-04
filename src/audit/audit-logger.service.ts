import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { AuditLog } from './schemas/audit-log.schema';

interface QueuedAuditEvent {
  event: Omit<AuditLog, 'createdAt'>;
  retries: number;
  firstAttempt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class AuditLoggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditLoggerService.name);
  private readonly queue: QueuedAuditEvent[] = [];
  private processing = false;
  private intervalHandle!: NodeJS.Timeout;

  constructor(private readonly repo: AuditRepository) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => this.processQueue(), 30_000);
  }

  onModuleDestroy() {
    clearInterval(this.intervalHandle);
  }

  async log(event: Omit<AuditLog, 'createdAt'>): Promise<void> {
    try {
      await this.repo.insert({ ...event, createdAt: new Date() });
    } catch (e: any) {
      this.logger.warn(`Audit write failed (will retry): ${e.message}`);
      this.enqueue({ event, retries: 0, firstAttempt: Date.now() });
    }
  }

  private enqueue(item: QueuedAuditEvent): void {
    this.queue.push(item);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      const delay = RETRY_DELAY_MS * Math.pow(2, item.retries);

      if (Date.now() - item.firstAttempt > 60_000) {
        this.logger.error(`Audit event dropped after 60s of retries: ${item.event.eventType}`);
        this.queue.shift();
        continue;
      }

      if (item.retries > 0) {
        await this.sleep(delay);
      }

      try {
        await this.repo.insert({ ...item.event, createdAt: new Date() });
        this.queue.shift();
        this.logger.log(`Audit event retry succeeded: ${item.event.eventType}`);
      } catch (e: any) {
        item.retries++;
        if (item.retries >= MAX_RETRIES) {
          this.logger.error(`Audit event permanently failed after ${MAX_RETRIES} retries: ${item.event.eventType}`);
          this.queue.shift();
        } else {
          this.logger.warn(`Audit retry ${item.retries}/${MAX_RETRIES} failed: ${e.message}`);
        }
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
