import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './webhook.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
}
bootstrap();
