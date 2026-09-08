import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AuthUser } from '../common/types';
import { DrawService } from './draw.service';

@Controller()
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @Get('broadcast/recent')
  recentWinners() {
    return this.drawService.recentWinners();
  }

  @UseGuards(JwtAuthGuard)
  @Get('draw/quota')
  quota(@Req() request: Request & { user: AuthUser }) {
    return this.drawService.getQuota(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('draw')
  draw(@Req() request: Request & { user: AuthUser }) {
    return this.drawService.draw(request.user);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('draw/reset')
  resetQuota(@Req() request: Request & { user: AuthUser }) {
    return this.drawService.resetQuota(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(@Req() request: Request & { user: AuthUser }) {
    return this.drawService.history(request.user);
  }
}
