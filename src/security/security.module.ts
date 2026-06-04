import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module';
import { BruteForceProtectionService } from './brute-force-protection.service';
import { TimingSafeService } from './timing-safe.service';
import { CsrfMiddleware } from './csrf.middleware';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        limit: 20,
        ttl: 60_000,
      },
      {
        name: 'medium',
        limit: 100,
        ttl: 300_000,
      },
      {
        name: 'login',
        limit: 10,
        ttl: 60_000,
      },
      {
        name: 'token',
        limit: 30,
        ttl: 60_000,
      },
    ]),
  ],
  providers: [BruteForceProtectionService, TimingSafeService, CsrfMiddleware],
  exports: [BruteForceProtectionService, TimingSafeService, CsrfMiddleware, ThrottlerModule],
})
export class SecurityModule {}
