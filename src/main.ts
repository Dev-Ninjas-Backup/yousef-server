import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ENVEnum } from './common/enum/env.enum';
import { AllExceptionsFilter } from './common/filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // --------------Swagger config with Bearer Auth------------------
  const config = new DocumentBuilder()
    .setTitle('yousef-backend')
    .setDescription('Team yousef-backend API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ------------enable cors---------------
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
        'https://c039be995102.ngrok-free.app',
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

  // ---------------webhook raw body middleware----------------
  app.use((req: any, res: any, next: any) => {
    console.log('🔍 Middleware check:', req.originalUrl);
    if (
      req.originalUrl === '/payments/webhook' ||
      req.originalUrl === '/payments/stripe-webhook' ||
      req.originalUrl === '/payment/webhook' ||
      req.originalUrl === '/webhook'
    ) {
      console.log('📦 Processing webhook raw body for:', req.originalUrl);
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: any) => {
        data += chunk;
      });
      req.on('end', () => {
        req.rawBody = Buffer.from(data);
        next();
      });
    } else {
      next();
    }
  });

  // ---------------webhook raw body parser----------------
  // Stripe requires the raw body to construct the event.
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
  app.use(
    '/payments/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
  app.use('/payment/webhook', bodyParser.raw({ type: 'application/json' }));
  app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get<string>(ENVEnum.PORT) ?? '5000', 10);
  await app.listen(port);
  console.log(` Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
