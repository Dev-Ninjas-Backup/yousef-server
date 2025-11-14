import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ENVEnum } from './common/enum/env.enum';
import { AllExceptionsFilter } from './common/filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --------------Swagger config with Bearer Auth------------------
  const config = new DocumentBuilder()
    .setTitle('yousef-backend')
    .setDescription('Team yousef-backend API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5050',
        'https://beta.australiancanvas.com',
        'https://indiansydny.vercel.app',
        'http://localhost:5050',
        'http://localhost:5173',
        'https://api.australiancanvas.com/docs',
        'https://australiancanvas.com',
        'https://beta.australiancanvas.com',
        'https://ai.australiancanvas.com',
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  // --------swagger api----

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
  // ---------------webhook raw body parser----------------
  // Stripe requires the raw body to construct the event.
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get<string>(ENVEnum.PORT) ?? '5000', 10);
  await app.listen(port);
  console.log(` Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
