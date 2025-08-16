import { ProposalItem as PrismaProposalItem } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ProposalItem implements PrismaProposalItem {
  @ApiProperty({ description: 'ID do item' })
  id: string;

  @ApiProperty({ description: 'Descrição do item' })
  description: string;

  @ApiProperty({ description: 'Quantidade do item' })
  quantity: number;

  @ApiProperty({ description: 'Preço unitário do item' })
  unitPrice: number;

  @ApiProperty({ description: 'Total do item (quantity * unitPrice)' })
  total: number;

  @ApiProperty({ description: 'ID da proposta a qual o item pertence' })
  proposalId: string;
}
