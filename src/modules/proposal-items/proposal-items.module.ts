import { Module } from '@nestjs/common';
import { ProposalItemsService } from './proposal-items.service';
import { ProposalItemsController } from './proposal-items.controller';
import { PrismaService } from 'src/common/services/prisma.service';

@Module({
  controllers: [ProposalItemsController],
  providers: [ProposalItemsService, PrismaService],
  exports: [ProposalItemsService],
})
export class ProposalItemsModule {}
