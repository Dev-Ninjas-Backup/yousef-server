import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Language = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.query.lang ||
      request.query.language ||
      request.headers['x-language'] ||
      request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
      process.env.DEFAULT_LANGUAGE ||
      'en'
    );
  },
);
