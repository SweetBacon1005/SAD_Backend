// Wishlist Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Product } from './product.schema';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class WishlistItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;
  
  @Prop({ type: MongooseSchema.Types.ObjectId })
  variantId: string;
  
  @Prop({ default: Date.now })
  addedAt: Date;
  
  @Prop()
  note: string;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  
  @Prop({ default: 'My Wishlist' })
  name: string;
  
  @Prop()
  description: string;
  
  @Prop({ type: [WishlistItemSchema], default: [] })
  items: WishlistItem[];
  
  @Prop({ default: false })
  isPublic: boolean;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Create indexes
WishlistSchema.index({ user: 1 });
WishlistSchema.index({ isPublic: 1 });
WishlistSchema.index({ 'items.product': 1 });
