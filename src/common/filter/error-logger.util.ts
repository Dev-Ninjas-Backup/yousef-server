import { Logger } from '@nestjs/common';

export class ErrorLogger {
  private static logger = new Logger('ErrorHandler');

  static log(error: any, context: any) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      url: context.request.url,
      method: context.request.method,
      statusCode: context.statusCode,
      message: context.message,
      errorCode: context.errorCode,
      userId: context.request.user?.id,
      ip: context.request.ip,
      userAgent: context.request.headers['user-agent'],
      details: context.details,
    };

    if (context.statusCode >= 500) {
      this.logger.error(errorInfo, error.stack);
    } else if (context.statusCode >= 400) {
      this.logger.warn(errorInfo);
    } else {
      this.logger.log(errorInfo);
    }
  }
}
