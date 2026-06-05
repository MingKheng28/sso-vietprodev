import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, _: any, next: () => void) { req.requestId = req.headers['x-request-id'] ?? randomUUID(); next(); }
}
