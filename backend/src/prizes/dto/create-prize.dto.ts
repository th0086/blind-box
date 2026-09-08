import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePrizeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsNumber()
  @Min(0)
  probability!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceProbability?: number;

  @IsOptional()
  @IsBoolean()
  marqueeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoMarqueeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  autoMarqueeIntervalMinutes?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  showInTeasers?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
