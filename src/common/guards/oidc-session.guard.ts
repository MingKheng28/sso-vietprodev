import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
@Injectable()
export class OidcSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user && !req.session?.accountId) throw new UnauthorizedException('OIDC session required');
    return true;
  }
}
