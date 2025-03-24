import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  parent: Category;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ name: 'text' });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });
