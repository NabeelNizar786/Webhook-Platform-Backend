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
  private readonly MAIN_QUEUE = 'webhook_events';
  private readonly RETRY_QUEUE = 'events_retry_30s';

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Webhook Worker Module...');
    this.start();
  }

  async start() {
    const connection = await amqp.connect('amqp://rabbitmq:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(this.MAIN_QUEUE, { durable: true });

    this.logger.log('Webhook worker started...');

    channel.consume(this.MAIN_QUEUE, async (msg) => {
      if (!msg) return;

      const { eventId } = JSON.parse(msg.content.toString());
      const event = await this.eventModel.findById(eventId);

      if (!event) {
        this.logger.warn(`Event ${eventId} not found in DB, discarding.`);
        channel.ack(msg);
        return;
      }

      try {
        const webhook = await this.webhookModel.findById(event.webhookId);
        if (!webhook) throw new Error('Webhook configuration missing');

        this.logger.log(`Attempting to hit: ${webhook.callbackUrl}`);
        let result = await axios.post(webhook.callbackUrl, event.payload);
        console.log('Result from webhook delivery:', result);

        event.status = EventStatus.SUCCESS;
        event.lastError = 'null';
        await event.save();
        channel.ack(msg);
      } catch (err) {
        this.logger.error(`Failed to process event ${eventId}: ${err.message}`);

        event.retryCount += 1;
        event.lastError = err.message;

        if (event.retryCount >= this.maxRetries) {
          this.logger.error(`Max retries reached for event ${eventId}. Stop.`);
          event.status = EventStatus.FAILED;
          await event.save();
          channel.ack(msg);
        } else {
          this.logger.log(
            `Retrying event ${eventId} (Attempt ${event.retryCount}). Waiting 30s...`,
          );
          event.status = EventStatus.PENDING;
          await event.save();

          channel.sendToQueue(
            this.RETRY_QUEUE,
            Buffer.from(JSON.stringify({ eventId: event._id })),
            { persistent: true },
          );

          channel.ack(msg);
        }
      }
    });
  }
}
