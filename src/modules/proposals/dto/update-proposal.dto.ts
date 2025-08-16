import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @ApiProperty({ description: 'A versão da proposta', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  version?: number;
}
