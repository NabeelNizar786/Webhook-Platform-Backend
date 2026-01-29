import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from '../events/events.schema';
import axios from 'axios';
import { Webhook } from '../webhooks/webhooks.schema';

@Injectable()
export class RetryProcessor {
  private MAX_RETRIES = 3;

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  @Cron('*/30 * * * * *') // every 30 seconds
  async retryFailedEvents() {
    console.log('Retrying failed events...');
    const failedEvents = await this.eventModel.find({
      status: { $in: [EventStatus.FAILED, EventStatus.PENDING] },
      retryCount: { $lt: this.MAX_RETRIES },
    });

    for (const event of failedEvents) {
      const webhook = await this.webhookModel.findById(event.webhookId);
      if (!webhook) continue;

      try {
        await axios.post(webhook.callbackUrl, event.payload);
        event.status = EventStatus.SUCCESS;
      } catch (err) {
        event.retryCount += 1;
        event.lastError = err.message;

        if (event.retryCount >= this.MAX_RETRIES) {
          event.status = EventStatus.FAILED;
        } else {
          event.status = EventStatus.PENDING;
        }

        await event.save();
      }

      await event.save();
    }
  }
}
