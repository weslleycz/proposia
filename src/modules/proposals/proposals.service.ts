import { CACHE_MANAGER, Cache, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { FindProposalsDto } from './dto/find-proposals.dto';
import {
  Prisma,
  Proposal,
  ProposalAction,
  ProposalStatus,
} from '@prisma/client';
import { ProposalLogsService } from '../proposal-logs/proposal-logs.service';
import { SendMailService } from 'src/common/services';

const proposalWithRelations = Prisma.validator<Prisma.ProposalDefaultArgs>()({
  include: { user: true, client: true, items: true },
});

export type ProposalWithRelations = Prisma.ProposalGetPayload<
  typeof proposalWithRelations
>;

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private proposalLogsService: ProposalLogsService,
    private sendMailService: SendMailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async logProposal(
    proposalId: string,
    userId: string,
    action: ProposalAction,
    oldData?: any,
    newData?: any,
  ) {
    await this.proposalLogsService.create({
      proposalId,
      changedById: userId,
      action,
      oldData,
      newData,
    });
  }

  async create(
    createProposalDto: CreateProposalDto,
    userId: string,
  ): Promise<Proposal> {
    const { clientId, items, ...rest } = createProposalDto;

    const clientExists = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(`Client with ID "${clientId}" not found`);
    }

    const calculatedTotalAmount = items
      ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : 0;

    const proposal = await this.prisma.proposal.create({
      data: {
        ...rest,
        totalAmount: calculatedTotalAmount,
        user: { connect: { id: userId } },
        client: { connect: { id: clientId } },
        status: createProposalDto.status || ProposalStatus.DRAFT,
        ...(items && items.length > 0
          ? {
              items: {
                createMany: {
                  data: items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                  })),
                },
              },
            }
          : {}),
      },
      include: { items: true, client: true },
    });

    await this.logProposal(proposal.id, userId, 'CREATED', null, proposal);
    await this.cacheManager.del(`proposal_logs_${proposal.id}`);

    if (proposal.client.email) {
      await this.sendMailService.send({
        to: proposal.client.email,
        subject: 'Nova proposta recebida',
        template: 'new-proposal.pug',
        parametros: {
          proposal,
        },
      });
    }

    return proposal;
  }

  async findAll(query: FindProposalsDto): Promise<Proposal[]> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const { title, status, clientId, userId } = query;

    return this.prisma.proposal.findMany({
      skip,
      take: limit,
      where: {
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(userId && { userId }),
      },
      include: { user: true, client: true, items: true },
    });
  }

  async findOne(id: string): Promise<ProposalWithRelations> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { user: true, client: true, items: true },
    });
    if (!proposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }
    return proposal;
  }

  @CacheTTL(300)
  @CacheKey('proposal_logs_')
  async findLogsByProposalId(proposalId: string) {
    return this.prisma.proposalLog.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(
    id: string,
    updateProposalDto: UpdateProposalDto,
    userId: string,
  ): Promise<Proposal> {
    const existingProposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    const { items, ...rest } = updateProposalDto;

    const updatedProposal = await this.prisma.proposal.update({
      where: { id },
      data: {
        ...rest,
        version: existingProposal.version + 1,
        ...(items !== undefined
          ? {
              items: {
                deleteMany: {},
                createMany: {
                  data: items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity as number,
                    unitPrice: item.unitPrice as number,
                    total:
                      (item.quantity as number) * (item.unitPrice as number),
                  })),
                },
              },
            }
          : {}),
      },
      include: { items: true, client: true },
    });

    const recalculatedProposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!recalculatedProposal) {
      throw new NotFoundException(
        `Proposal with ID "${id}" not found after update.`,
      );
    }

    const newTotalAmount = recalculatedProposal.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    await this.prisma.proposal.update({
      where: { id },
      data: { totalAmount: newTotalAmount },
    });

    if (items !== undefined && updatedProposal.client.email) {
      const total = updatedProposal.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      (updatedProposal as any).total = total;

      await this.sendMailService.send({
        to: updatedProposal.client.email,
        subject: 'Proposta Atualizada',
        template: 'new-proposal.pug',
        parametros: {
          proposal: updatedProposal,
        },
      });
    }

    await this.logProposal(
      id,
      userId,
      'VERSIONED',
      existingProposal,
      updatedProposal,
    );
    await this.cacheManager.del(`proposal_logs_${id}`);

    return updatedProposal;
  }

  async remove(id: string, userId: string): Promise<Proposal> {
    const existingProposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    const deletedProposal = await this.prisma.proposal.delete({
      where: { id },
    });

    await this.logProposal(id, userId, 'DELETED', existingProposal);
    await this.cacheManager.del(`proposal_logs_${id}`);

    return deletedProposal;
  }
}
