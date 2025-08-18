import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { ProposalStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateProposalItemDto } from '../../proposal-items/dto';

export class CreateProposalDto {
  @ApiProperty({ description: 'O título da proposta', example: 'Redesenho do Website' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'A descrição da proposta', required: false, example: 'Redesenho do website da empresa para melhorar a UX.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'O status da proposta', enum: ProposalStatus, default: ProposalStatus.DRAFT, required: false })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiProperty({ description: 'O ID do cliente associado à proposta', example: 'clx000000000000000000000' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ type: [CreateProposalItemDto], description: 'Itens da proposta', required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}
