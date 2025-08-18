import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { EmailService, ProposalPdfService, S3Service, SendMailService } from 'src/common/services';
import { PrismaService } from 'src/common/services/prisma.service';
import { ProposalLogsModule } from '../proposal-logs/proposal-logs.module';
import { ProposalsService } from '../proposals/proposals.service';
import { ProposalItemsController } from './proposal-items.controller';
import { ProposalItemsService } from './proposal-items.service';

@Module({
  controllers: [ProposalItemsController],
  imports: [ProposalLogsModule, CacheModule.register()],
  providers: [
    ProposalItemsService,
    PrismaService,
    ProposalsService,
    S3Service,
    SendMailService,
    ProposalPdfService,
    EmailService
  ],
  exports: [ProposalItemsService],
})
export class ProposalItemsModule {}
