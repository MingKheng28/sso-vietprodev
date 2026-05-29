import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
@Injectable()
export class OidcClaimsService { constructor(private readonly users: UsersService) {} async claims(_: string, sub: string) { const user = await this.users.findById(sub); return { sub, email: user?.email, email_verified: true, preferred_username: user?.username ?? user?.email, name: user?.username ?? user?.email }; } }
