import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from './category.schema';
import { Store } from './store.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: 0 })
  costPrice: number;

  @Prop({ default: 0 })
  quantity: number;

  @Prop({ type: Object })
  attributes: Record<string, string>;

  @Prop([String])
  images: string[];
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }] })
  categories: Category[];

  @Prop({ default: 0 })
  basePrice: number;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Store' }] })
  store: Store;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop([String])
  images: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ isPublished: 1, isFeatured: 1 });
ProductSchema.index({ createdAt: -1 });
