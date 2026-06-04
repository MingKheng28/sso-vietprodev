import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { BruteForceProtectionService } from '../security/brute-force-protection.service';
import { TimingSafeService } from '../security/timing-safe.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly bruteForce: BruteForceProtectionService,
    private readonly timingSafe: TimingSafeService,
  ) {}

  async validateUser(email: string, password: string): Promise<{ id: string; email: string; username: string; status: string }> {
    const isLocked = await this.bruteForce.isLockedOut(email);
    if (isLocked) {
      throw new BadRequestException('Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.');
    }

    const user = await this.users.findByEmail(email);

    if (!user || user.status !== 'active') {
      await this.bruteForce.checkAndRecord(email, user?.id ?? null, false);
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const passwordValid = await this.timingSafe.safeAuthenticate(password, user.password_hash);

    if (!passwordValid) {
      await this.bruteForce.checkAndRecord(email, user.id, false);
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    await this.bruteForce.checkAndRecord(email, user.id, true);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
    };
  }
}
