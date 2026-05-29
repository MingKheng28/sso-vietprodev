import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { UsersModule } from '../users/users.module';
@Module({ imports: [UsersModule], providers: [AuthService, PasswordService, SessionService], exports: [AuthService, PasswordService, SessionService] })
export class AuthModule {}
