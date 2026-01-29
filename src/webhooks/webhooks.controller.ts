import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req) {
    console.log(req.user.userId);
    return this.webhooksService.findAll(req.user.userId);
  }

  @Delete(':id')
  cancel(@Req() req, @Param('id') id: string) {
    return this.webhooksService.cancel(req.user.userId, id);
  }
}
