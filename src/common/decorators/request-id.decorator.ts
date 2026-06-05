import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
export const RequestId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().requestId,
);
