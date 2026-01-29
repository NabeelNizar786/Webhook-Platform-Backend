import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Webhook extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  source: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true })
  callbackUrl: string;

  @Prop({ enum: WebhookStatus, default: WebhookStatus.ACTIVE })
  status: WebhookStatus;

  @Prop({ required: true })
  secret: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
