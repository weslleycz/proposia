import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services';
import { CreateProposalLogDto } from './dto';

@Injectable()
export class ProposalLogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProposalLogDto: CreateProposalLogDto) {
    return this.prisma.proposalLog.create({ data: createProposalLogDto });
  }
}
