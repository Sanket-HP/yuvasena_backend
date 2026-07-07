import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable Global Prefix
  app.setGlobalPrefix('api/v1');

  // 2. Security Headers & Protection
  app.use(helmet());
  
  // 3. CORS Configuration
  app.enableCors({
    origin: '*', // Allow all origins for mobile client, customize in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 4. Response Compression
  app.use(compression());

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Yuva Sena Digital Platform API')
    .setDescription('Production-ready backend services for membership registration, events, complaints, and leaders portal.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 7. Port Binding
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[Yuva Sena API Backend] running on: http://localhost:${port}/api/v1`);
  console.log(`[OpenAPI Documentation] running on: http://localhost:${port}/api/docs`);
}

bootstrap();
