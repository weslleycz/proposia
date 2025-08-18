import { ApiProperty } from '@nestjs/swagger';
import { ProposalAction } from '@prisma/client';

export class ProposalLogDto {
  @ApiProperty({
    description: 'ID do log da proposta',
    example: 'clx000000000000000000000',
  })
  id: string;

  @ApiProperty({
    description: 'ID da proposta associada',
    example: 'clx000000000000000000000',
  })
  proposalId: string;

  @ApiProperty({
    description: 'ID do usuário que realizou a mudança',
    example: 'clx000000000000000000000',
  })
  changedById: string;

  @ApiProperty({
    description: 'Ação realizada na proposta',
    enum: ProposalAction,
    example: ProposalAction.UPDATED,
  })
  action: ProposalAction;

  @ApiProperty({
    description: 'Dados antigos (JSON)',
    type: 'object',
    additionalProperties: true,
  })
  oldData?: object;

  @ApiProperty({
    description: 'Novos dados (JSON)',
    type: 'object',
    additionalProperties: true,
  })
  newData?: object;

  @ApiProperty({
    description: 'Data e hora da criação do log',
    example: '2025-08-18T10:00:00.000Z',
  })
  createdAt: Date;
}
