import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { FindProposalsDto } from './dto/find-proposals.dto';
import { Proposal, ProposalStatus } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async create(createProposalDto: CreateProposalDto, userId: string): Promise<Proposal> {
    const { clientId, ...rest } = createProposalDto;
    return this.prisma.proposal.create({
      data: {
        ...rest,
        user: {
          connect: { id: userId },
        },
        client: {
          connect: { id: clientId },
        },
        status: createProposalDto.status || ProposalStatus.DRAFT, // Default to DRAFT if not provided
      },
    });
  }

  async findAll(query: FindProposalsDto): Promise<Proposal[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
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
      include: { user: true, client: true },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { user: true, client: true },
    });
    if (!proposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }
    return proposal;
  }

  async update(id: string, updateProposalDto: UpdateProposalDto): Promise<Proposal> {
    const existingProposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    return this.prisma.proposal.update({
      where: { id },
      data: updateProposalDto,
    });
  }

  async remove(id: string): Promise<Proposal> {
    const existingProposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }
    return this.prisma.proposal.delete({
      where: { id },
    });
  }

  async version(id: string): Promise<Proposal> {
    const originalProposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!originalProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    // Create a new proposal with incremented version and link to the same client and user
    const newVersion = await this.prisma.proposal.create({
      data: {
        title: originalProposal.title,
        description: originalProposal.description,
        totalAmount: originalProposal.totalAmount,
        status: ProposalStatus.DRAFT, // New version starts as DRAFT
        version: originalProposal.version + 1,
        pdfUrl: null, // New version should not have a PDF initially
        userId: originalProposal.userId,
        clientId: originalProposal.clientId,
      },
    });

    return newVersion;
  }
}