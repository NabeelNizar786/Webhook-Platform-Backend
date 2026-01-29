import { Controller, Post, Body, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // external services call this
  @Post(':webhookId')
  async receiveEvent(
    @Param('webhookId') webhookId: string,
    @Body() payload: any,
  ) {
    await this.eventsService.create(webhookId, payload);
    return { status: 'received' };
  }
}
