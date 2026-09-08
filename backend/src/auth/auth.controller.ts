import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.phone, body.password);
    this.setAuthCookie(response, result.token);
    return { success: true };
  }

  @Get('sso')
  async sso(
    @Query('phone') phone: string,
    @Query('merchant') merchant: string,
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.ssoLogin({ phone, merchant, token });
    this.setAuthCookie(response, result.token);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: Request & { user: { sub: string; phone: string; role: 'user' | 'super_admin' } }) {
    return this.authService.me(request.user);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('bb_token');
    return { success: true };
  }

  private setAuthCookie(response: Response, token: string): void {
    response.cookie('bb_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
