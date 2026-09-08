import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../common/types';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(phone: string, password: string): Promise<{ token: string }> {
    const user = await this.usersService.findByPhone(phone);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.signToken({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return { token };
  }

  async ssoLogin(query: {
    phone: string;
    merchant: string;
    token: string;
  }): Promise<{ token: string }> {
    if (!query.phone || !query.merchant || !query.token) {
      throw new BadRequestException('phone, merchant and token are required');
    }

    const expectedMerchant = this.configService.get<string>('MERCHANT_ID');
    if (expectedMerchant && query.merchant !== expectedMerchant) {
      throw new UnauthorizedException('Merchant mismatch');
    }

    const user = await this.usersService.createOrUpdateSsoUser(query);
    const token = await this.signToken({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return { token };
  }

  async me(user: AuthUser): Promise<AuthUser> {
    return user;
  }

  private async signToken(payload: AuthUser): Promise<string> {
    const expiry = this.configService.get<string>('JWT_EXPIRY') ?? '7d';
    return this.jwtService.signAsync(payload, { expiresIn: expiry });
  }
}
