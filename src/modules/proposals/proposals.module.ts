import { Module } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import {
  EmailService,
  PrismaService,
  ProposalPdfService,
  S3Service,
  SendMailService,
} from 'src/common/services';
import { ProposalLogsModule } from '../proposal-logs/proposal-logs.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ProposalLogsModule, CacheModule.register()],
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    PrismaService,
    ProposalPdfService,
    SendMailService,
    EmailService,
    S3Service,
  ],
})
export class ProposalsModule {}
