// Store Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type StoreDocument = Store & Document;

@Schema()
export class StoreAddress {
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
  latitude: number;
  
  @Prop()
  longitude: number;
}

export const StoreAddressSchema = SchemaFactory.createForClass(StoreAddress);

@Schema()
export class BusinessHours {
  @Prop({ default: '09:00' })
  openTime: string;
  
  @Prop({ default: '17:00' })
  closeTime: string;
  
  @Prop({ default: true })
  isOpen: boolean;
}

export const BusinessHoursSchema = SchemaFactory.createForClass(BusinessHours);

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true, unique: true })
  slug: string;
  
  @Prop()
  description: string;
  
  @Prop({ required: true, unique: true })
  email: string;
  
  @Prop()
  phone: string;
  
  @Prop()
  website: string;
  
  @Prop({ type: StoreAddressSchema })
  address: StoreAddress;
  
  @Prop()
  logo: string;
  
  @Prop([String])
  images: string[];
  
  @Prop()
  bannerImage: string;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: User;
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  staff: User[];
  
  @Prop({ default: true })
  isActive: boolean;
  
  @Prop({ default: false })
  isVerified: boolean;
  
  @Prop({ type: Object })
  businessHours: {
    monday: BusinessHours;
    tuesday: BusinessHours;
    wednesday: BusinessHours;
    thursday: BusinessHours;
    friday: BusinessHours;
    saturday: BusinessHours;
    sunday: BusinessHours;
  };
  
  @Prop({ default: 0 })
  avgRating: number;
  
  @Prop({ default: 0 })
  reviewCount: number;
  
  @Prop({ type: Object })
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    pinterest?: string;
    youtube?: string;
  };
  
  @Prop({ type: Object })
  paymentMethods: string[];
  
  @Prop({ type: Object })
  shippingMethods: string[];
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  settings: Record<string, any>;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Create indexes
StoreSchema.index({ name: 'text', description: 'text' });
StoreSchema.index({ slug: 1 });
StoreSchema.index({ owner: 1 });
StoreSchema.index({ isActive: 1 });
StoreSchema.index({ 'address.city': 1, 'address.state': 1, 'address.country': 1 });
