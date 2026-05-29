import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly passwords: PasswordService) {}
  async validateUser(email: string, password: string) { const user = await this.users.findByEmail(email); if (!user || user.status !== 'active') throw new UnauthorizedException('Invalid credentials'); const ok = await this.passwords.verify(user.password_hash, password); if (!ok) throw new UnauthorizedException('Invalid credentials'); return user; }
}
