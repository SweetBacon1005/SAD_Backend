// Review Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Product } from './product.schema';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: Product;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  comment: string;

  @Prop([String])
  images: string[];

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy: User;

  @Prop()
  approvedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Create indexes
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isPublished: 1 });
ReviewSchema.index({ createdAt: -1 });

