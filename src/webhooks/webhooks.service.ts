import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webhook, WebhookStatus } from './webhooks.schema';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(Webhook.name)
    private webhookModel: Model<Webhook>,
  ) {}

  create(userId: string, dto: CreateWebhookDto) {
    const secret = randomBytes(32).toString('hex');
    return this.webhookModel.create({
      ...dto,
      secret,
      userId,
    });
  }

  findAll(userId: string) {
    return this.webhookModel.find({ userId }).select('-secret');
  }

  async cancel(userId: string, webhookId: string) {
    const webhook = await this.webhookModel.findOne({
      _id: webhookId,
      userId,
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    webhook.status = WebhookStatus.CANCELLED;
    return webhook.save();
  }
}
