import * as amqp from 'amqplib';

export class RabbitMQService {
  private static channel: amqp.Channel;

  static async getChannel(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;

    const connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();

    const MAIN_QUEUE = 'webhook_events';
    await channel.assertQueue(MAIN_QUEUE, {
      durable: true,
    });

    const RETRY_QUEUE = 'events_retry_30s';
    await channel.assertQueue(RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-message-ttl': 30000,
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': MAIN_QUEUE,
      },
    });

    this.channel = channel;
    return channel;
  }
}
