import { Injectable, Logger } from '@nestjs/common';
import { SsoPoolService } from '../database/postgres/sso-pool.service';

export interface LoginAttemptRecord {
  userId: string | null;
  email: string;
  attempts: number;
  lockedUntil: Date | null;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class BruteForceProtectionService {
  private readonly logger = new Logger(BruteForceProtectionService.name);

  constructor(private readonly db: SsoPoolService) {}

  async checkAndRecord(email: string, userId: string | null, success: boolean): Promise<void> {
    if (success) {
      await this.resetAttempts(userId, email);
      return;
    }

    const attempts = await this.getAttempts(email);
    const nextAttempts = attempts + 1;
    const lockedUntil = nextAttempts >= LOCKOUT_THRESHOLD
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    await this.db.query(
      `INSERT INTO login_attempts (id, email, user_id, attempt_count, locked_until, last_attempt_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET
         attempt_count = CASE WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until < NOW()
           THEN 1 ELSE login_attempts.attempt_count + 1 END,
         user_id = COALESCE($2, login_attempts.user_id),
         locked_until = CASE WHEN login_attempts.locked_until IS NOT NULL AND login_attempts.locked_until < NOW()
           THEN $4 ELSE COALESCE($4, login_attempts.locked_until) END,
         last_attempt_at = NOW()`,
      [email, userId, nextAttempts, lockedUntil],
    );
  }

  async isLockedOut(email: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT locked_until FROM login_attempts
       WHERE lower(email) = lower($1)
         AND attempt_count >= $2
         AND locked_until > NOW()`,
      [email, LOCKOUT_THRESHOLD],
    );
    return result.rows.length > 0;
  }

  private async getAttempts(email: string): Promise<number> {
    const result = await this.db.query(
      `SELECT attempt_count FROM login_attempts
       WHERE lower(email) = lower($1)
         AND (locked_until IS NULL OR locked_until > NOW())`,
      [email],
    );
    return result.rows[0]?.attempt_count ?? 0;
  }

  private async resetAttempts(userId: string | null, email: string): Promise<void> {
    await this.db.query(
      `UPDATE login_attempts SET attempt_count = 0, locked_until = NULL
       WHERE lower(email) = lower($1) AND (user_id = $2 OR $2 IS NULL)`,
      [email, userId],
    );
  }
}
