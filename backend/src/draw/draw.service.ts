import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/types';
import { Prize, PrizeDocument } from '../prizes/prize.schema';
import { UsersService } from '../users/users.service';
import { BroadcastGateway } from './broadcast.gateway';
import { DrawRecord, DrawRecordDocument } from './draw.schema';

@Injectable()
export class DrawService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly broadcastGateway: BroadcastGateway,
    @InjectModel(Prize.name) private readonly prizeModel: Model<PrizeDocument>,
    @InjectModel(DrawRecord.name) private readonly drawModel: Model<DrawRecordDocument>,
  ) {}

  async getQuota(user: AuthUser) {
    const dbUser = await this.usersService.findById(user.sub);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    this.usersService.normalizeDailyUsage(dbUser);
    await dbUser.save();

    const dailyLimit = Number(this.configService.get<string>('DAILY_DRAW_LIMIT') ?? 3);
    const usedToday = dbUser.drawsToday;
    const remainingToday = Math.max(0, dailyLimit - usedToday);

    return { dailyLimit, usedToday, remainingToday };
  }

  async draw(user: AuthUser) {
    const dbUser = await this.usersService.findById(user.sub);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    this.usersService.normalizeDailyUsage(dbUser);

    const dailyLimit = Number(this.configService.get<string>('DAILY_DRAW_LIMIT') ?? 3);
    if (dbUser.drawsToday >= dailyLimit) {
      throw new BadRequestException('Daily draw limit reached');
    }

    const prizes = await this.prizeModel.find({ isActive: true, value: { $gt: 0 } }).lean();
    if (!prizes.length) {
      throw new BadRequestException('No active prizes with remaining stock configured');
    }

    const selected = this.pickPrize(prizes);
    const serialNumber = this.generateSerialNumber();

    await this.drawModel.create({
      userId: new Types.ObjectId(dbUser.id),
      phone: dbUser.phone,
      prizeId: new Types.ObjectId(String(selected._id)),
      prizeName: selected.name,
      prizeValue: selected.value,
      serialNumber,
    });

    await this.prizeModel.updateOne({ _id: selected._id }, { $inc: { value: -1 } });

    dbUser.drawsToday += 1;
    dbUser.lastDrawDate = new Date().toISOString().slice(0, 10);
    await dbUser.save();

    const remainingToday = Math.max(0, dailyLimit - dbUser.drawsToday);
    if (selected.marqueeEnabled !== false) {
      this.broadcastGateway.emitWinner(`${this.maskPhone(dbUser.phone)} won ${selected.name}`);
    }

    return {
      prize: {
        id: selected._id,
        name: selected.name,
        value: selected.value,
      },
      serialNumber,
      remainingToday,
      usedToday: dbUser.drawsToday,
      dailyLimit,
    };
  }

  async resetQuota(user: AuthUser) {
    const dbUser = await this.usersService.findById(user.sub);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    dbUser.drawsToday = 0;
    dbUser.lastDrawDate = new Date().toISOString().slice(0, 10);
    await dbUser.save();

    return this.getQuota(user);
  }

  async history(user: AuthUser) {
    return this.drawModel
      .find({ userId: new Types.ObjectId(user.sub) })
      .sort({ createdAt: -1 })
      .lean();
  }

  recentWinners() {
    return this.broadcastGateway.getRecentWinners();
  }

  private pickPrize(prizes: Array<{ _id: unknown; name: string; value: number; probability: number; marqueeEnabled?: boolean }>) {
    const total = prizes.reduce((sum, item) => sum + item.probability, 0);
    if (total <= 0) {
      throw new BadRequestException('Invalid prize probability setup');
    }

    let random = Math.random() * total;
    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }

    return prizes[prizes.length - 1];
  }

  private generateSerialNumber(): string {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i += 1) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
    return `BB-${date}-${randomPart}`;
  }

  private maskPhone(phone: string): string {
    const hasPlus = phone.startsWith('+');
    const digits = phone.replace(/\D/g, '');

    if (digits.length <= 6) {
      return `${hasPlus ? '+' : ''}${'*'.repeat(Math.max(4, digits.length))}`;
    }

    const head = digits.slice(0, 3);
    const tail = digits.slice(-3);
    const maskedMiddle = '*'.repeat(digits.length - 6);
    return `${hasPlus ? '+' : ''}${head}${maskedMiddle}${tail}`;
  }
}
