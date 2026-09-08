import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'user' | 'super_admin';
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phone!: string;

  @Prop()
  passwordHash?: string;

  @Prop({ required: true, enum: ['user', 'super_admin'], default: 'user' })
  role!: UserRole;

  @Prop()
  merchant?: string;

  @Prop()
  token?: string;

  @Prop({ default: 0 })
  drawsToday!: number;

  @Prop()
  lastDrawDate?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
