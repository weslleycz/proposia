import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProposalItemDto, UpdateProposalItemDto } from './dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { ProposalItem } from './entities';
import { ProposalsService } from '../proposals/proposals.service';

@Injectable()
export class ProposalItemsService {
  constructor(
    private prismaService: PrismaService,
    private proposalsService: ProposalsService,
  ) {}

  private get proposalItemRepository() {
    return this.prismaService.proposalItem;
  }

  private get proposalRepository() {
    return this.prismaService.proposal;
  }

  async create(
    proposalId: string,
    createProposalItemDto: CreateProposalItemDto,
  ): Promise<ProposalItem> {
    const proposal = await this.proposalRepository.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found`);
    }

    const total =
      createProposalItemDto.quantity * createProposalItemDto.unitPrice;

    const item = await this.proposalItemRepository.create({
      data: {
        ...createProposalItemDto,
        total,
        proposal: { connect: { id: proposalId } },
      },
    });

    await this.updateProposalTotal(proposalId);

    const updatedProposal = await this.proposalsService.findOne(proposalId);
    const { s3Url, pdfBuffer } = await this.proposalsService['generateAndUploadPdf'](proposalId);

    if (updatedProposal.client.email) {
      await this.proposalsService['sendMailService'].send({
        to: updatedProposal.client.email,
        subject: 'Proposta Atualizada - Novo Item Adicionado',
        template: 'new-proposal.pug',
        parametros: {
          proposal: updatedProposal,
        },
        attachments: [
          {
            filename: `proposta-${updatedProposal.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }

    return item;
  }

  async findAll(proposalId: string): Promise<ProposalItem[]> {
    return this.proposalItemRepository.findMany({ where: { proposalId } });
  }

  async findOne(proposalId: string, id: string): Promise<ProposalItem> {
    const item = await this.proposalItemRepository.findFirst({
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
    const existingItem = await this.proposalItemRepository.findFirst({
      where: { id, proposalId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `ProposalItem with ID ${id} not found for Proposal ${proposalId}`,
      );
    }

    const quantity = updateProposalItemDto.quantity ?? existingItem.quantity;
    const unitPrice = updateProposalItemDto.unitPrice ?? existingItem.unitPrice;

    const total = quantity * unitPrice;

    const updatedItem = await this.proposalItemRepository.update({
      where: { id },
      data: {
        ...updateProposalItemDto,
        total,
      },
    });

    await this.updateProposalTotal(proposalId);

    const updatedProposal = await this.proposalsService.findOne(proposalId);

    const { s3Url, pdfBuffer } = await this.proposalsService['generateAndUploadPdf'](proposalId);

    if (updatedProposal.client.email) {
      await this.proposalsService['sendMailService'].send({
        to: updatedProposal.client.email,
        subject: 'Proposta Atualizada - Item Modificado',
        template: 'new-proposal.pug',
        parametros: {
          proposal: updatedProposal,
        },
        attachments: [
          {
            filename: `proposta-${updatedProposal.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }

    return updatedItem;
  }

  async remove(proposalId: string, id: string): Promise<ProposalItem> {
    const existingItem = await this.proposalItemRepository.findFirst({
      where: { id, proposalId },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `ProposalItem with ID ${id} not found for Proposal ${proposalId}`,
      );
    }

    const deletedItem = await this.proposalItemRepository.delete({
      where: { id },
    });

    await this.updateProposalTotal(proposalId);

    const updatedProposal = await this.proposalsService.findOne(proposalId);
    const { s3Url, pdfBuffer } = await this.proposalsService['generateAndUploadPdf'](proposalId);

    if (updatedProposal.client.email) {
      await this.proposalsService['sendMailService'].send({
        to: updatedProposal.client.email,
        subject: 'Proposta Atualizada',
        template: 'new-proposal.pug',
        parametros: {
          proposal: updatedProposal,
        },
        attachments: [
          {
            filename: `proposta-${updatedProposal.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    }

    return deletedItem;
  }

  private async updateProposalTotal(proposalId: string) {
    const items = await this.proposalItemRepository.findMany({
      where: { proposalId },
      select: { total: true },
    });

    const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

    await this.proposalRepository.update({
      where: { id: proposalId },
      data: { totalAmount },
    });
  }
}
