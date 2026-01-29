import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Webhook, WebhookStatus } from './webhooks.schema';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(Webhook.name)
    private webhookModel: Model<Webhook>,
  ) {}

  create(userId: string, dto: CreateWebhookDto) {
    return this.webhookModel.create({
      ...dto,
      userId,
    });
  }

  findAll(userId: string) {
    return this.webhookModel.find({ userId });
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
