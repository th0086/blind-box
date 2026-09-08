import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
import { PrizesService } from './prizes.service';

@Controller('prizes')
export class PrizesController {
  constructor(private readonly prizesService: PrizesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive: string) {
    return this.prizesService.findAll(includeInactive === 'true');
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  create(@Body() body: CreatePrizeDto) {
    return this.prizesService.create(body);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.prizesService.uploadImage(file);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePrizeDto) {
    return this.prizesService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prizesService.remove(id);
  }
}
