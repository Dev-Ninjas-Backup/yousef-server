import { ErrorResponse } from '../error/error.interface';

export function errorResponse(
  statusCode: number,
  message: string | string[],
  error: string,
  path: string,
  method: string,
  errorCode?: string,
  details?: any,
  stack?: string,
  requestId?: string,
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    statusCode,
    timestamp: new Date().toISOString(),
    path,
    method,
    message,
    error,
    requestId,
  };

  // Add optional fields
  if (errorCode) {
    response['errorCode'] = errorCode;
  }

  if (details) {
    response.details = details;
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }

  return response;
}

export function successResponse<T>(data: T, message: string = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
