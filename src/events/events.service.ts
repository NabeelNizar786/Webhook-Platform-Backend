import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './events.schema';
import { Webhook } from '../webhooks/webhooks.schema';
import axios from 'axios';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  async create(webhookId: string, payload: any) {
    const webhook = await this.webhookModel.findById(webhookId);

    if (!webhook || webhook.status !== 'ACTIVE') {
      throw new NotFoundException('Webhook not active');
    }

    const event = await this.eventModel.create({
      webhookId,
      payload,
    });

    this.deliverEvent(event, webhook);
// **** if you wanna swithc to rabbit mq, you can uncomment below ****
//**** when switching to rabbit mq, you should also comment out this.deliverEvent(event, webhook); ****

    // const channel = await RabbitMQService.getChannel();
    // channel.sendToQueue(
    //   'webhook_events',
    //   Buffer.from(
    //     JSON.stringify({
    //       eventId: event._id.toString(),
    //     }),
    //   ),
    //   { persistent: true },
    // );
    return event;
  }

  async deliverEvent(event: Event, webhook: Webhook) {
    try {
      await axios.post(webhook.callbackUrl, event.payload);
      event.status = EventStatus.SUCCESS;
      await event.save();
    } catch (err) {
      event.status = EventStatus.FAILED;
      event.retryCount += 1;
      event.lastError = err.message;
      await event.save();
    }
  }

  // async fetchEvents(webhookId: string) {
  //   return await this.eventModel.find({ webhookId }).exec();
  // }
}
