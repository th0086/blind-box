import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrizeDocument = HydratedDocument<Prize>;

@Schema({ timestamps: true })
export class Prize {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  // Remaining stock count for admin management and draw depletion.
  @Prop({ required: true })
  value!: number;

  // Actual draw probability used by the lottery engine.
  @Prop({ required: true })
  probability!: number;

  // Surface probability shown in the Prize List UI.
  @Prop({ required: false, default: 0 })
  surfaceProbability!: number;

  // Whether a winner of this prize should be broadcast in the marquee.
  @Prop({ required: false, default: true })
  marqueeEnabled!: boolean;

  // Whether this prize should auto-generate marquee winners on a fixed interval.
  @Prop({ required: false, default: false })
  autoMarqueeEnabled!: boolean;

  // Interval in minutes for auto marquee winner generation.
  @Prop({ required: false, default: 0 })
  autoMarqueeIntervalMinutes!: number;

  @Prop({ default: '' })
  imageUrl!: string;

  @Prop({ required: false, default: false })
  showInTeasers!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PrizeSchema = SchemaFactory.createForClass(Prize);
