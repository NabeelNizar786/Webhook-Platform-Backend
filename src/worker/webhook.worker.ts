import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as amqp from 'amqplib';
import axios from 'axios';
import { Event, EventStatus } from '../events/events.schema';
import { Webhook } from '../webhooks/webhooks.schema';

@Injectable()
export class WebhookWorker implements OnModuleInit {
  private readonly logger = new Logger(WebhookWorker.name);
  private maxRetries = 5;

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  async onModuleInit() {
    this.start();
  }

  async start() {
    const connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue('webhook_events', { durable: true });

    this.logger.log('Webhook worker started...');

    channel.consume('webhook_events', async (msg) => {
      if (!msg) return;

      const { eventId } = JSON.parse(msg.content.toString());

      const event = await this.eventModel.findById(eventId);
      if (!event) {
        channel.ack(msg);
        return;
      }

      try {
        const webhook = await this.webhookModel.findById(event.webhookId);
        if (!webhook) throw new Error('Webhook not found');

        await axios.post(webhook.callbackUrl, event.payload);

        event.status = EventStatus.SUCCESS;
        await event.save();

        channel.ack(msg);
      } catch (err) {
        event.retryCount += 1;
        event.status = EventStatus.FAILED;
        event.lastError = err.message;
        await event.save();

        if (event.retryCount >= this.maxRetries) {
          event.status = EventStatus.FAILED;
          await event.save();
          channel.ack(msg);
        } else {
          event.retryCount += 1;
          event.status = EventStatus.PENDING;
          await event.save();

          channel.sendToQueue(
            'events_retry_30s',
            Buffer.from(JSON.stringify({ eventId: event._id })),
          );
          
          channel.ack(msg);
        }

        await event.save();

        // if (event.retryCount < 5) {
        //   channel.nack(msg, false, true); // retry
        // } else {
        //   channel.ack(msg); // drop / DLQ
        // }
      }
    });
  }
}
