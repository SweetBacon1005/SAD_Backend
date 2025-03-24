// Notification Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes
NotificationSchema.index({ user: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ category: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire
