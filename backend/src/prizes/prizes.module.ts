import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Prize, PrizeSchema } from './prize.schema';
import { PrizesController } from './prizes.controller';
import { PrizesService } from './prizes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prize.name, schema: PrizeSchema }]),
    AuthModule,
  ],
  controllers: [PrizesController],
  providers: [PrizesService],
  exports: [PrizesService, MongooseModule],
})
export class PrizesModule {}
