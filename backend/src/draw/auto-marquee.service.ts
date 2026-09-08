import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prize, PrizeDocument } from '../prizes/prize.schema';
import { BroadcastGateway } from './broadcast.gateway';

@Injectable()
export class AutoMarqueeService implements OnModuleInit, OnModuleDestroy {
  private readonly lastEmitAt = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @InjectModel(Prize.name) private readonly prizeModel: Model<PrizeDocument>,
    private readonly broadcastGateway: BroadcastGateway,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, 10_000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const now = Date.now();
      const prizes = await this.prizeModel
        .find({
          isActive: true,
          marqueeEnabled: true,
          autoMarqueeEnabled: true,
          value: { $gt: 0 },
          autoMarqueeIntervalMinutes: { $gt: 0 },
        })
        .lean();

      const activeIds = new Set(prizes.map((prize) => String(prize._id)));
      for (const id of this.lastEmitAt.keys()) {
        if (!activeIds.has(id)) {
          this.lastEmitAt.delete(id);
        }
      }

      for (const prize of prizes) {
        const id = String(prize._id);
        const intervalMs = Number(prize.autoMarqueeIntervalMinutes ?? 0) * 60_000;
        if (intervalMs <= 0) {
          continue;
        }

        const lastAt = this.lastEmitAt.get(id);
        if (lastAt === undefined) {
          this.lastEmitAt.set(id, now);
          continue;
        }

        if (now - lastAt < intervalMs) {
          continue;
        }

        const deductResult = await this.prizeModel.updateOne(
          { _id: prize._id, value: { $gt: 0 } },
          { $inc: { value: -1 } },
        );
        if (deductResult.modifiedCount === 0) {
          continue;
        }

        this.lastEmitAt.set(id, now);
        this.broadcastGateway.emitWinner(`${this.maskPhone(this.generateRandomPhone())} won ${prize.name}`);
      }
    } finally {
      this.running = false;
    }
  }

  private generateRandomPhone(): string {
    const suffix = Math.floor(10_000_000 + Math.random() * 90_000_000);
    return `+2547${suffix}`;
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
