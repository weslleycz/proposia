
import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';
import { IsInt, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateProposalItemDto } from '../../proposal-items/dto';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @ApiProperty({ description: 'A versão da proposta', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  version?: number;

  @ApiProperty({ type: [CreateProposalItemDto], description: 'Itens da proposta para atualização', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}


