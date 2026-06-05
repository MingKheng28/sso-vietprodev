import { Injectable, NestMiddleware } from '@nestjs/common';
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    res.setHeader('X-Request-Id', req.requestId ?? req.headers['x-request-id'] ?? '');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  }
}
