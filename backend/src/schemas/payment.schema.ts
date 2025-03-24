
// Payment Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Order } from './order.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class PaymentMethod {
  @Prop({ required: true, enum: ['credit_card', 'paypal', 'bank_transfer', 'wallet', 'crypto'] })
  type: string;
  
  @Prop({ required: true })
  title: string;
  
  @Prop({ type: Object })
  details: Record<string, any>;
  
  @Prop({ default: true })
  isDefault: boolean;
  
  @Prop()
  expiresAt: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order' })
  order: Order;
  
  @Prop({ required: true })
  amount: number;
  
  @Prop()
  currency: string;
  
  @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'] })
  status: string;
  
  @Prop({ required: true, enum: ['payment', 'refund', 'payout'] })
  type: string;
  
  @Prop({ required: true, enum: ['credit_card', 'paypal', 'bank_transfer', 'wallet', 'crypto', 'other'] })
  paymentMethod: string;
  
  @Prop({ type: Object })
  paymentDetails: Record<string, any>;
  
  @Prop()
  paymentIntentId: string;
  
  @Prop()
  receiptUrl: string;
  
  @Prop()
  notes: string;
  
  @Prop()
  refundedAmount: number;
  
  @Prop({ type: [MongooseSchema.Types.Mixed] })
  refundHistory: {
    amount: number;
    reason: string;
    status: string;
    transactionId: string;
    processedAt: Date;
  }[];
  
  @Prop({ type: Object })
  billingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Create indexes
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ createdAt: -1 });