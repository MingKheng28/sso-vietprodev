import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || req.headers['x-admin-api-key'] !== expected) throw new UnauthorizedException('Admin API key required');
    return true;
  }
}
