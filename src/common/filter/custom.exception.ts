import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../error/error.interface';

export class CustomException extends HttpException {
  constructor(
    message: string | string[],
    statusCode: HttpStatus,
    public errorCode?: ErrorCode,
    public details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
      },
      statusCode,
    );
  }
}

// Specific exception classes
export class ValidationException extends CustomException {
  constructor(message: string | string[], details?: any) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class NotFoundException extends CustomException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(message, HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, {
      resource,
      identifier,
    });
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string = 'Access forbidden') {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
  }
}

export class ConflictException extends CustomException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details);
  }
}

export class BusinessRuleException extends CustomException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      details,
    );
  }
}

export class DatabaseException extends CustomException {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.DATABASE_ERROR,
      details,
    );
  }
}

export class ExternalServiceException extends CustomException {
  constructor(service: string, details?: any) {
    super(
      `External service '${service}' is unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      { service, ...details },
    );
  }
}

export class RateLimitException extends CustomException {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      { retryAfter },
    );
  }
}
