import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class TimingSafeService {
  constantEquals(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) {
      Buffer.compare(Buffer.from(a), Buffer.from(b));
      return false;
    }
    return Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;
  }

  safeAuthenticate(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password).catch(() => false);
  }
}
