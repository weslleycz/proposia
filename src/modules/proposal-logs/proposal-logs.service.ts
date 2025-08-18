import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services';
import { CreateProposalLogDto } from './dto';

@Injectable()
export class ProposalLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private get proposalLogRepository() {
    return this.prisma.proposalLog;
  }

  create(createProposalLogDto: CreateProposalLogDto) {
    return this.proposalLogRepository.create({ data: createProposalLogDto });
  }
}
