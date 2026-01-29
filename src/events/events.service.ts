import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './events.schema';
import { Webhook } from '../webhooks/webhooks.schema';
import axios from 'axios';

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
}
