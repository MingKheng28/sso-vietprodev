import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const accept = (req.headers.accept ?? '').toLowerCase();
    const wantsHtml = accept.includes('text/html') || accept === '*/*';
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';
    if (wantsHtml) {
      res.status(status);
      if (res.locals && typeof res.locals === 'object') {
        Object.assign(res.locals, { statusCode: status, message });
      }
      const err = exception instanceof Error ? exception : new Error(String(exception));
      return host.switchToHttp().getNext()(err);
    }
    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
