
// Cart Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Product } from './product.schema';

export type CartDocument = Cart & Document;

@Schema()
export class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  variantId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: Object })
  attributes: Record<string, string>;
  
  @Prop()
  addedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Create indexes
CartSchema.index({ user: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
