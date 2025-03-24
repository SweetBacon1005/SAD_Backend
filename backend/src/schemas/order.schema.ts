// Order Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Product } from './product.schema';
import { User } from './user.schema';

export type OrderDocument = Order & Document;

@Schema()
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  variantId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ type: Object })
  attributes: Record<string, string>;

  @Prop()
  image: string;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema()
export class ShippingInfo {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  addressLine1: string;

  @Prop()
  addressLine2: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  phone: string;

  @Prop()
  trackingNumber: string;

  @Prop()
  carrier: string;
}

@Schema()
export class PaymentInfo {
  @Prop({
    required: true,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
  })
  method: string;

  @Prop({
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
  })
  status: string;

  @Prop()
  transactionId: string;

  @Prop()
  receiptUrl: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  details: Record<string, any>;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({
    required: true,
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ],
  })
  status: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  total: number;

  @Prop({ type: ShippingInfo, required: true })
  shippingInfo: ShippingInfo;

  @Prop({ type: PaymentInfo })
  paymentInfo: PaymentInfo;

  @Prop()
  notes: string;

  @Prop()
  estimatedDeliveryDate: Date;

  @Prop()
  shippedAt: Date;

  @Prop()
  deliveredAt: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Create indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'paymentInfo.status': 1 });
