import { Module } from '@nestjs/common';
import { ProposalLogsService } from './proposal-logs.service';
import { PrismaService } from 'src/common/services';

@Module({
  providers: [ProposalLogsService, PrismaService],
  exports: [ProposalLogsService],
})
export class ProposalLogsModule {}
