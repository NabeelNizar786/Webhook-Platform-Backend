import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './events.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from 'src/webhooks/webhooks.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Webhook.name, schema: WebhookSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
