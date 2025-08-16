import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { RedisService } from 'src/common/services';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, RedisService],
})
export class ClientsModule {}
