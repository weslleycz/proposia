import { CreateProposalDto } from './create-proposal.dto';
import { IsInt, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateProposalItemDto } from '../../proposal-items/dto';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @ApiProperty({
    type: [CreateProposalItemDto],
    description: 'Itens da proposta para atualização',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];

  @ApiProperty({
    description: 'Descrição da proposta',
    required: false,
    example: 'Proposta atualizada para o cliente X',
  })
  @IsOptional()
  description?: string | undefined;

  @ApiProperty({
    description: 'Título da proposta',
    required: false,
    example: 'Proposta Comercial - Versão 2',
  })
  @IsOptional()
  title?: string | undefined;
}
