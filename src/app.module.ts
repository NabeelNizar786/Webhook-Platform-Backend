import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EventsModule } from './events/events.module';
import { RetryModule } from './retry/retry.module';
import { CommonModule } from './common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DB_SECRET'),
      }),
    }),
    AuthModule,
    WebhooksModule,
    EventsModule,
    RetryModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
