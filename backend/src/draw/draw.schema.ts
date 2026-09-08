import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DrawRecordDocument = HydratedDocument<DrawRecord>;

@Schema({ timestamps: true })
export class DrawRecord {
  @Prop({ type: Types.ObjectId, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  phone!: string;

  @Prop({ type: Types.ObjectId, required: true })
  prizeId!: Types.ObjectId;

  @Prop({ required: true })
  prizeName!: string;

  @Prop({ required: true })
  prizeValue!: number;

  @Prop({ required: true, unique: true })
  serialNumber!: string;
}

export const DrawRecordSchema = SchemaFactory.createForClass(DrawRecord);
