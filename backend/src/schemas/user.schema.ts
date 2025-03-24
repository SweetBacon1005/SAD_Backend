// User Schema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema()
export class Address {
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

  @Prop({ default: false })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone: string;

  @Prop({ default: 'customer', enum: ['admin', 'manager', 'customer'] })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  @Prop()
  avatar: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  preferences: Record<string, any>;

  @Prop()
  stripeCustomerId: string;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @Prop()
  emailVerificationToken: string;

  @Prop({ default: false })
  isEmailVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password validity
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });