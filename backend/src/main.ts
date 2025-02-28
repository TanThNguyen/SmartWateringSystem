import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
// import * as session from 'express-session';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5050;
  app.setGlobalPrefix('/api', {exclude: ['']});

  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  //add middleware Here!
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.useStaticAssets(join(__dirname,'../../data'))
  await app.listen(port);
  console.log(`Listening on port ${port}`);
}
bootstrap();
