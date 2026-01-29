import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EventsModule } from './events/events.module';
import { RetryModule } from './retry/retry.module';
import { CommonModule } from './common/common.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [AuthModule, WebhooksModule, EventsModule, RetryModule, CommonModule],
  controllers: [ AuthController],
  providers: [ AuthService],
})
export class AppModule {}
