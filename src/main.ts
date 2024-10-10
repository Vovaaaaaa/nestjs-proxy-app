import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionsFilter } from './proxy/exception/global-exception.handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log']
  });
  await app.listen(3000);
  app.useGlobalFilters(new GlobalExceptionsFilter());
}
bootstrap();


