import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        // Add request context to error
        const request = context.switchToHttp().getRequest();
        err.requestContext = {
          url: request.url,
          method: request.method,
          body: request.body,
          query: request.query,
          params: request.params,
          user: request.user?.id,
        };

        return throwError(() => err);
      }),
    );
  }
}
