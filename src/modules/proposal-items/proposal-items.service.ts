import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProposalItemDto, UpdateProposalItemDto } from './dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { ProposalItem } from './entities';

@Injectable()
export class ProposalItemsService {
  constructor(private prisma: PrismaService) {}

  async create(
    proposalId: string,
    createProposalItemDto: CreateProposalItemDto,
  ): Promise<ProposalItem> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found`);
    }

    const total =
      createProposalItemDto.quantity * createProposalItemDto.unitPrice;

    const item = await this.prisma.proposalItem.create({
      data: {
        ...createProposalItemDto,
        total,
        proposal: { connect: { id: proposalId } },
      },
    });

    await this.updateProposalTotal(proposalId);

    return item;
  }

  async findAll(proposalId: string): Promise<ProposalItem[]> {
    return this.prisma.proposalItem.findMany({ where: { proposalId } });
  }

  async findOne(proposalId: string, id: string): Promise<ProposalItem> {
    const item = await this.prisma.proposalItem.findFirst({
      where: { id, proposalId },
    });

    if (!item) {
      throw new NotFoundException(
        `ProposalItem with ID ${id} not found for Proposal ${proposalId}`,
      );
    }

    return item;
  }

  async update(
    proposalId: string,
    id: string,
    updateProposalItemDto: UpdateProposalItemDto,
  ): Promise<ProposalItem> {
    const existingItem = await this.prisma.proposalItem.findFirst({
      where: { id, proposalId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `ProposalItem with ID ${id} not found for Proposal ${proposalId}`,
      );
    }

    const quantity =
      updateProposalItemDto.quantity ?? existingItem.quantity;
    const unitPrice =
      updateProposalItemDto.unitPrice ?? existingItem.unitPrice;

    const total = quantity * unitPrice;

    const updatedItem = await this.prisma.proposalItem.update({
      where: { id },
      data: {
        ...updateProposalItemDto,
        total,
      },
    });

    await this.updateProposalTotal(proposalId);

    return updatedItem;
  }

  async remove(proposalId: string, id: string): Promise<ProposalItem> {
    const existingItem = await this.prisma.proposalItem.findFirst({
      where: { id, proposalId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `ProposalItem with ID ${id} not found for Proposal ${proposalId}`,
      );
    }

    const deletedItem = await this.prisma.proposalItem.delete({
      where: { id },
    });

    await this.updateProposalTotal(proposalId);

    return deletedItem;
  }

  private async updateProposalTotal(proposalId: string) {
    const items = await this.prisma.proposalItem.findMany({
      where: { proposalId },
      select: { total: true },
    });

    const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { totalAmount },
    });
  }
}
