import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import * as csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfHandler: ReturnType<typeof csurf>;

  constructor() {
    this.csrfHandler = csurf({
      cookie: {
        httpOnly: false,
        sameSite: 'strict',
      },
      value: (req: Request) => {
        return req.body?._csrf ?? req.headers['x-csrf-token'] ?? req.headers['x-xsrf-token'];
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    this.csrfHandler(req, res, (err: unknown) => {
      if (err) {
        return next(new HttpException('Invalid CSRF token', HttpStatus.FORBIDDEN));
      }
      return next();
    });
  }
}
