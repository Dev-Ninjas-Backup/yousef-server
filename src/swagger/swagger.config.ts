import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Backend API Documentation')
  .setDescription(
    'Comprehensive API documentation for the application services',
  )
  .setVersion('1.0')
  .addTag('API')

  .addBearerAuth()
  .addSecurityRequirements({
    auth: [],
  })
  .build();
