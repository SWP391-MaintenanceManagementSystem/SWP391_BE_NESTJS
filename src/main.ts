import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? 'localhost', () => {
    console.log(`Server is running on http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
