import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Webhook', required: true })
  webhookId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ enum: EventStatus, default: EventStatus.PENDING })
  status: EventStatus;
 
  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastError?: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
