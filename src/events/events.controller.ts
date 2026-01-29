import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { InjectModel, raw } from '@nestjs/mongoose';
import { Webhook } from 'src/webhooks/webhooks.schema';
import { Model } from 'mongoose';
import { verifySignature } from 'src/common/utils/signature.util';

@Controller('events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
  ) {}

  @Post(':webhookId')
  async receiveEvent(
    @Param('webhookId') webhookId: string,
    @Body() payload: any,
    @Req() req: any,
  ) {
    const signature = req.headers['x-webhook-signature'];

    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const webhook: any = await this.webhookModel.findById(webhookId);

    const isValid = verifySignature(webhook?.secret, req.rawBody, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    await this.eventsService.create(webhookId, payload);
    return { status: 'received' };
  }

  // @Get(':webhookId')
  // async fetchEvent(@Param('webhookId') webhookId: string) {
  //   return this.eventsService.fetchEvents(webhookId);
  // }
}
