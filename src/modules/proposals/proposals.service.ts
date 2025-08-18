import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { FindProposalsDto } from './dto/find-proposals.dto';
import { Prisma, Proposal, ProposalAction, ProposalStatus } from '@prisma/client';
import { ProposalLogsService } from '../proposal-logs/proposal-logs.service';

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

    const proposal = await this.prisma.proposal.create({
      data: {
        ...rest,
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
      include: { items: true },
    });

    await this.logProposal(proposal.id, userId, 'CREATED', null, proposal);

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
      include: { items: true },
    });

    await this.logProposal(
      id,
      userId,
      'UPDATED',
      existingProposal,
      updatedProposal,
    );

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

    return deletedProposal;
  }

  async version(id: string, userId: string): Promise<Proposal> {
    const originalProposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    const newVersion = await this.prisma.proposal.create({
      data: {
        title: originalProposal.title,
        description: originalProposal.description,
        totalAmount: originalProposal.totalAmount,
        status: ProposalStatus.DRAFT,
        version: originalProposal.version + 1,
        pdfUrl: null,
        userId: originalProposal.userId,
        clientId: originalProposal.clientId,
        items: {
          createMany: {
            data: originalProposal.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        parentId: id,
      },
      include: { items: true },
    });

    await this.logProposal(
      newVersion.id,
      userId,
      'VERSIONED',
      originalProposal,
      newVersion,
    );

    return newVersion;
  }
}