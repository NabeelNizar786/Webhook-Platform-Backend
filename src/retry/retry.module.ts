import { Module } from '@nestjs/common';
import { RetryProcessor } from './retry.processor';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from 'src/events/events.schema';
import { Webhook, WebhookSchema } from 'src/webhooks/webhooks.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Webhook.name, schema: WebhookSchema },
    ]),
  ],
  providers: [RetryProcessor],
})
export class RetryModule {}
