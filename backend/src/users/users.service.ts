import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSuperAdmin();
  }

  async ensureSuperAdmin(): Promise<void> {
    const phone = this.configService.get<string>('SUPER_ADMIN_PHONE');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

    if (!phone || !password) {
      return;
    }

    const existing = await this.userModel.findOne({ phone });
    const passwordHash = await bcrypt.hash(password, 10);

    if (!existing) {
      await this.userModel.create({
        phone,
        passwordHash,
        role: 'super_admin',
        drawsToday: 0,
      });
      return;
    }

    if (existing.role !== 'super_admin') {
      existing.role = 'super_admin';
    }

    if (!existing.passwordHash) {
      existing.passwordHash = passwordHash;
    } else {
      const matched = await bcrypt.compare(password, existing.passwordHash);
      if (!matched) {
        // Keep deployed env password as source of truth for super admin bootstrap account.
        existing.passwordHash = passwordHash;
      }
    }

    await existing.save();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async createOrUpdateSsoUser(input: {
    phone: string;
    merchant: string;
    token: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ phone: input.phone });

    if (existing) {
      existing.merchant = input.merchant;
      existing.token = input.token;
      await existing.save();
      return existing;
    }

    return this.userModel.create({
      phone: input.phone,
      merchant: input.merchant,
      token: input.token,
      role: 'user',
      drawsToday: 0,
    });
  }

  normalizeDailyUsage(user: UserDocument): UserDocument {
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDrawDate !== today) {
      user.lastDrawDate = today;
      user.drawsToday = 0;
    }
    return user;
  }
}
