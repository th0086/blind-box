import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
import { Prize, PrizeDocument } from './prize.schema';

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class PrizesService implements OnModuleInit {
  private readonly s3Client: S3Client;
  private readonly spacesBucket: string;
  private readonly spacesPrefix: string;
  private readonly publicBaseUrl: string;

  constructor(
    @InjectModel(Prize.name) private readonly prizeModel: Model<PrizeDocument>,
    private readonly configService: ConfigService,
  ) {
    const endpoint = this.getRequiredConfig('DO_SPACES_ENDPOINT');
    this.spacesBucket = this.getRequiredConfig('DO_SPACES_BUCKET');
    this.spacesPrefix = this.configService.get<string>('DO_SPACES_TEAMS_PREFIX')?.trim() || 'prize';
    this.publicBaseUrl = this.getRequiredConfig('DO_SPACES_PUBLIC_BASE_URL').replace(/\/$/, '');

    this.s3Client = new S3Client({
      region: this.getRequiredConfig('DO_SPACES_REGION'),
      endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
      credentials: {
        accessKeyId: this.getRequiredConfig('DO_SPACES_ACCESS_KEY'),
        secretAccessKey: this.getRequiredConfig('DO_SPACES_SECRET_KEY'),
      },
    });
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  async onModuleInit(): Promise<void> {
    const count = await this.prizeModel.countDocuments();
    if (count > 0) {
      await this.prizeModel.updateMany(
        { surfaceProbability: { $exists: false } },
        [{ $set: { surfaceProbability: '$probability' } }],
      );
      await this.prizeModel.updateMany(
        { marqueeEnabled: { $exists: false } },
        { $set: { marqueeEnabled: true } },
      );
      await this.prizeModel.updateMany(
        { autoMarqueeEnabled: { $exists: false } },
        { $set: { autoMarqueeEnabled: false } },
      );
      await this.prizeModel.updateMany(
        { autoMarqueeIntervalMinutes: { $exists: false } },
        { $set: { autoMarqueeIntervalMinutes: 0 } },
      );
      await this.prizeModel.updateMany(
        { showInTeasers: { $exists: false } },
        { $set: { showInTeasers: false } },
      );
      return;
    }

    await this.prizeModel.insertMany([
      { name: 'PS5', description: 'PlayStation 5', value: 1, probability: 0.07, surfaceProbability: 0.07, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: 'Switch', description: 'Nintendo Switch', value: 1, probability: 0.07, surfaceProbability: 0.07, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '10000 kes Bonus', description: 'Cash bonus', value: 10000, probability: 0.5, surfaceProbability: 0.5, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '5000 kes Bonus', description: 'Cash bonus', value: 5000, probability: 0.5, surfaceProbability: 0.5, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '1000 kes Bonus', description: 'Cash bonus', value: 1000, probability: 0.5, surfaceProbability: 0.5, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '10 kes Bonus', description: 'Cash bonus', value: 10, probability: 0.36, surfaceProbability: 0.36, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '9 kes Bonus', description: 'Cash bonus', value: 9, probability: 1, surfaceProbability: 1, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '8 kes Bonus', description: 'Cash bonus', value: 8, probability: 2, surfaceProbability: 2, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '7 kes Bonus', description: 'Cash bonus', value: 7, probability: 3, surfaceProbability: 3, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '6 kes Bonus', description: 'Cash bonus', value: 6, probability: 4, surfaceProbability: 4, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '5 kes Bonus', description: 'Cash bonus', value: 5, probability: 8, surfaceProbability: 8, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '4 kes Bonus', description: 'Cash bonus', value: 4, probability: 10, surfaceProbability: 10, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '3 kes Bonus', description: 'Cash bonus', value: 3, probability: 15, surfaceProbability: 15, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '2 kes Bonus', description: 'Cash bonus', value: 2, probability: 25, surfaceProbability: 25, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
      { name: '1 kes Bonus', description: 'Cash bonus', value: 1, probability: 30, surfaceProbability: 30, marqueeEnabled: true, autoMarqueeEnabled: false, autoMarqueeIntervalMinutes: 0, showInTeasers: false, isActive: true },
    ]);
  }

  async findAll(includeInactive = false): Promise<Prize[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.prizeModel.find(query).sort({ probability: 1, surfaceProbability: 1, name: 1 }).lean();
  }

  async create(dto: CreatePrizeDto): Promise<Prize> {
    await this.validateTotalProbability(dto.probability);
    return this.prizeModel.create({
      ...dto,
      description: dto.description ?? '',
      imageUrl: dto.imageUrl ?? '',
      showInTeasers: dto.showInTeasers ?? false,
      isActive: dto.isActive ?? true,
      surfaceProbability: dto.surfaceProbability ?? dto.probability,
      marqueeEnabled: dto.marqueeEnabled ?? true,
      autoMarqueeEnabled: dto.autoMarqueeEnabled ?? false,
      autoMarqueeIntervalMinutes: dto.autoMarqueeIntervalMinutes ?? 0,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const extension = IMAGE_EXTENSION_BY_MIME[file.mimetype] || extname(file.originalname || '').toLowerCase();
    if (!extension) {
      throw new BadRequestException('Unsupported image file type');
    }

    const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;
    const key = `${this.spacesPrefix}/${randomUUID()}${cleanExtension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.spacesBucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }),
    );

    return {
      imageUrl: `${this.publicBaseUrl}/${key}`,
    };
  }

  async update(id: string, dto: UpdatePrizeDto): Promise<Prize> {
    const existing = await this.prizeModel.findById(id);
    if (!existing) {
      throw new NotFoundException('Prize not found');
    }

    if (dto.probability !== undefined) {
      await this.validateTotalProbability(dto.probability, id);
    }

    Object.assign(existing, dto);
    if (dto.probability !== undefined && dto.surfaceProbability === undefined) {
      existing.surfaceProbability = dto.probability;
    }
    if (dto.showInTeasers === undefined && existing.showInTeasers === undefined) {
      existing.showInTeasers = false;
    }
    await existing.save();
    return existing;
  }

  async remove(id: string): Promise<{ success: true }> {
    const result = await this.prizeModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Prize not found');
    }
    return { success: true };
  }

  private async validateTotalProbability(nextProbability: number, excludeId?: string): Promise<void> {
    const all = await this.prizeModel.find(excludeId ? { _id: { $ne: excludeId } } : {}).lean();
    const total = all.reduce((sum, prize) => sum + (prize.probability ?? 0), 0) + nextProbability;
    if (total > 100) {
      throw new BadRequestException(`Total probability cannot exceed 100%. Current would be ${total.toFixed(2)}%`);
    }
  }
}
