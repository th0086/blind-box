import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Prize, PrizeSchema } from '../prizes/prize.schema';
import { UsersModule } from '../users/users.module';
import { AutoMarqueeService } from './auto-marquee.service';
import { BroadcastGateway } from './broadcast.gateway';
import { DrawController } from './draw.controller';
import { DrawRecord, DrawRecordSchema } from './draw.schema';
import { DrawService } from './draw.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: DrawRecord.name, schema: DrawRecordSchema },
      { name: Prize.name, schema: PrizeSchema },
    ]),
  ],
  controllers: [DrawController],
    providers: [DrawService, BroadcastGateway, AutoMarqueeService],
})
export class DrawModule {}
