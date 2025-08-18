import {
  CACHE_MANAGER,
  Cache,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
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
import {
  ProposalPdfService,
  S3Service,
  SendMailService,
} from 'src/common/services';
import { FindDeletedProposalsDto } from './dto/find-deleted-proposals.dto';

const proposalWithRelations = Prisma.validator<Prisma.ProposalDefaultArgs>()({
  include: { user: true, client: true, items: true },
});

export type ProposalWithRelations = Prisma.ProposalGetPayload<
  typeof proposalWithRelations
>;

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly proposalLogsService: ProposalLogsService,
    private readonly sendMailService: SendMailService,
    private readonly proposalPdfService: ProposalPdfService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private get proposalRepository() {
    return this.prismaService.proposal;
  }

  private get clientRepository() {
    return this.prismaService.client;
  }

  private get proposalLogRepository() {
    return this.prismaService.proposalLog;
  }

  private get proposalItemRepository() {
    return this.prismaService.proposalItem;
  }

  async create(
    createProposalDto: CreateProposalDto,
    userId: string,
  ): Promise<Proposal> {
    const { clientId, items, ...rest } = createProposalDto;

    const clientExists = await this.clientRepository.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new NotFoundException(`Client with ID "${clientId}" not found`);
    }

    const calculatedTotalAmount = items
      ? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      : 0;

    const proposal = await this.proposalRepository.create({
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

    const { s3Url, pdfBuffer } = await this.generateAndUploadPdf(proposal.id);
    const updatedProposal = await this.proposalRepository.update({
      where: { id: proposal.id },
      data: { pdfUrl: s3Url },
      include: { items: true, client: true },
    });

    if (updatedProposal.client.email) {
      await this.sendMailService.send({
        to: updatedProposal.client.email,
        subject: 'Nova proposta recebida',
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

    return updatedProposal;
  }

  async findAll(query: FindProposalsDto): Promise<Proposal[]> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const { title, status, clientId, userId } = query;

    return this.proposalRepository.findMany({
      skip,
      take: limit,
      where: {
        deletedAt: null,
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        client: true,
        items: true,
      },
    });
  }

  async findOne(id: string) {
    const proposal = await this.proposalRepository.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        client: true,
        items: true,
      },
    });
    if (!proposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }
    return proposal;
  }

  @CacheTTL(300)
  @CacheKey('proposal_logs_')
  async findLogsByProposalId(proposalId: string) {
    return this.proposalLogRepository.findMany({
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
    const existingProposal = await this.proposalRepository.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    const { items, ...rest } = updateProposalDto;

    const updatedProposal = await this.proposalRepository.update({
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

    const recalculatedProposal = await this.proposalRepository.findUnique({
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

    await this.proposalRepository.update({
      where: { id },
      data: { totalAmount: newTotalAmount },
    });

    const { s3Url: newS3Url, pdfBuffer: newPdfBuffer } =
      await this.generateAndUploadPdf(id);

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
        attachments: [
          {
            filename: `proposta-${updatedProposal.id}.pdf`,
            content: newPdfBuffer,
            contentType: 'application/pdf',
          },
        ],
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
    const existingProposal = await this.proposalRepository.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Proposal with ID "${id}" not found`);
    }

    const deletedProposal = await this.proposalRepository.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.logProposal(id, userId, 'DELETED', existingProposal);
    await this.cacheManager.del(`proposal_logs_${id}`);

    return deletedProposal;
  }

  async restore(id: string, userId: string): Promise<Proposal> {
    const existingProposal = await this.proposalRepository.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!existingProposal) {
      throw new NotFoundException(`Deleted proposal with ID "${id}" not found`);
    }

    const restoredProposal = await this.proposalRepository.update({
      where: { id },
      data: { deletedAt: null },
    });

    await this.logProposal(
      id,
      userId,
      'RESTORED',
      existingProposal,
      restoredProposal,
    );
    await this.cacheManager.del(`proposal_logs_${id}`);
    await this.cacheManager.del('deleted_proposals');

    return restoredProposal;
  }

  async revert(
    proposalId: string,
    logId: string,
    userId: string,
  ): Promise<Proposal> {
    const proposalLog = await this.proposalLogRepository.findUnique({
      where: { id: logId },
    });

    if (!proposalLog || proposalLog.proposalId !== proposalId) {
      throw new NotFoundException(
        `Log with ID "${logId}" not found for proposal "${proposalId}"`,
      );
    }

    const proposalToRevert = await this.proposalRepository.findUnique({
      where: { id: proposalId, deletedAt: null },
    });

    if (!proposalToRevert) {
      throw new NotFoundException(`Proposal with ID "${proposalId}" not found`);
    }

    const targetState = proposalLog.newData as any;
    if (!targetState || !targetState.items) {
      throw new Error('Log does not contain valid data to revert to.');
    }

    const revertedProposal = await this.prismaService.$transaction(async (tx) => {
      await tx.proposalItem.deleteMany({ where: { proposalId } });

      const newItems = targetState.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const reverted = await tx.proposal.update({
        where: { id: proposalId },
        data: {
          title: targetState.title,
          description: targetState.description,
          status: targetState.status,
          version: proposalToRevert.version + 1,
          items: {
            createMany: {
              data: newItems,
            },
          },
        },
        include: { items: true },
      });

      const totalAmount = reverted.items.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      return tx.proposal.update({
        where: { id: proposalId },
        data: { totalAmount },
      });
    });

    await this.logProposal(
      proposalId,
      userId,
      'REVERTED',
      proposalToRevert,
      revertedProposal,
    );

    await this.cacheManager.del(`proposal_logs_${proposalId}`);

    return revertedProposal;
  }

  async findDeleted(query: FindDeletedProposalsDto): Promise<Proposal[]> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const { title } = query;

    return this.proposalRepository.findMany({
      skip,
      take: limit,
      where: {
        deletedAt: { not: null },
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        client: true,
        items: true,
      },
    });
  }

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

  private async generateAndUploadPdf(
    proposalId: string,
  ): Promise<{ s3Url: string; pdfBuffer: Buffer }> {
    const proposal = await this.proposalRepository.findUnique({
      where: { id: proposalId, deletedAt: null },
      include: { user: true, client: true, items: true },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID "${proposalId}" not found`);
    }

    const pdfBuffer = await this.proposalPdfService.generate(proposal);
    const s3Key = `proposals/${proposal.id}.pdf`;
    const s3Url = await this.s3Service.uploadFile(
      s3Key,
      pdfBuffer,
      'application/pdf',
    );

    await this.proposalRepository.update({
      where: { id: proposalId },
      data: { pdfUrl: s3Url },
    });

    return { s3Url, pdfBuffer };
  }
}
