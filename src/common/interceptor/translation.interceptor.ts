import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslationService } from 'src/lib/translation/translation.service';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TranslationInterceptor.name);

  constructor(private readonly translationService: TranslationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Get language from query parameters, headers, or use default
    const language =
      request.query.lang ||
      request.query.language ||
      request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
      request.headers['x-language'] ||
      process.env.DEFAULT_LANGUAGE ||
      'en';

    // Skip translation if language is default or not set
    if (language === process.env.DEFAULT_LANGUAGE || language === 'en') {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        try {
          // Check if translation should be applied
          if (!data || !this.shouldTranslate(data)) {
            return data;
          }

          // Get fields to translate from metadata (if available)
          const fieldsToTranslate = Reflect.getMetadata(
            'translate:fields',
            context.getHandler(),
          );

          // Translate the response data
          const translated = await this.translationService.translateObject(
            data,
            language,
            fieldsToTranslate,
          );

          return translated;
        } catch (error) {
          this.logger.error(
            `Translation failed for language ${language}:`,
            error,
          );
          // Return original data if translation fails
          return data;
        }
      }),
    );
  }

  private shouldTranslate(data: any): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data === 'string' || typeof data === 'number') return false;
    return true;
  }
}
