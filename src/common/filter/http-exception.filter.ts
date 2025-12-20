import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ErrorCode } from '../error/error.interface';
import { CustomException } from './custom.exception';
import { ErrorLogger } from './error-logger.util';
import { errorResponse } from './response.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;
    let errorCode: string | undefined;
    let details: any = null;
    let stack: string | undefined;

    // Generate unique request ID
    const requestId = this.generateRequestId();

    // Handle different exception types
    if (exception instanceof CustomException) {
      // Custom application exceptions
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message;
      errorCode = res.errorCode;
      details = res.details;
      error = exception.name;
      stack = exception.stack;
    } else if (exception instanceof HttpException) {
      // Standard NestJS HTTP exceptions
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
        errorCode = resObj.errorCode;
        details = resObj.details;
      } else {
        message = 'An error occurred';
        error = exception.name;
      }
      stack = exception.stack;
    } else if (this.isPrismaError(exception)) {
      // Prisma database errors
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = 'DatabaseError';
      errorCode = ErrorCode.DATABASE_ERROR;
      details = prismaError.details;
      stack = (exception as Error).stack;
    } else if (exception instanceof Error) {
      // Native JavaScript errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
      error = exception.name;
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      details = {
        type: exception.constructor.name,
      };
      stack = exception.stack;
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'UnknownError';
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    }

    // Create error response
    const errorPayload = errorResponse(
      status,
      message,
      error,
      request.url,
      request.method,
      errorCode,
      details,
      stack,
      requestId,
    );

    // Log error with context
    ErrorLogger.log(exception, {
      request,
      statusCode: status,
      message,
      errorCode,
      details,
    });

    // Send response
    response.status(status).json(errorPayload);
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError ||
      exception instanceof Prisma.PrismaClientInitializationError
    );
  }

  private handlePrismaError(exception: unknown): {
    status: number;
    message: string;
    details: any;
  } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The provided value is too long for the column',
            details: { code: exception.code, meta: exception.meta },
          };
        case 'P2001':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Record not found',
            details: { code: exception.code, meta: exception.meta },
          };
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'Unique constraint violation',
            details: {
              code: exception.code,
              field: exception.meta?.target,
            },
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Foreign key constraint violation',
            details: { code: exception.code, meta: exception.meta },
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Record to update or delete not found',
            details: { code: exception.code, meta: exception.meta },
          };
        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Database operation failed',
            details: { code: exception.code },
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database validation error',
        details: { error: exception.message },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      details: {},
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
