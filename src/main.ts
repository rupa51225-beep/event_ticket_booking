import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,

    })
  )
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Api running on:http://localhost:${port}/api/v1`)
  // console.log(` Application is running on: http://localhost:${port}/api/v1/`);
}
bootstrap();
