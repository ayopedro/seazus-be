import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import * as useragent from 'express-useragent';
import * as requestIp from 'request-ip';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    /^(https:\/\/([^\.]*\.)?ngrok\.io)$/i,
    'https://localhost:3000',
    'http://localhost:3000',
    'https://localhost:5173',
    'http://localhost:5173',
    'https://seazus.onrender.com',
    'https://seazus.vercel.app',
    'https://scissor-cut.vercel.app',
    'https://scissors-ten.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: ':shortUrl', method: RequestMethod.GET }],
  });

  app.use(useragent.express());
  app.use(requestIp.mw());

  const config = new DocumentBuilder()
    .setTitle('URL Shortener')
    .setDescription('Get Simplified URLs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
