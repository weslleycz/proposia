import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ProposalStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindProposalsDto {
  @ApiProperty({ description: 'Filtrar por título da proposta (não sensível a maiúsculas/minúsculas, correspondência parcial)', required: false, example: 'Website' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Filtrar por status da proposta', enum: ProposalStatus, required: false, example: ProposalStatus.DRAFT })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiProperty({ description: 'Filtrar por ID do cliente', required: false, example: 'clx000000000000000000000' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Filtrar por ID do usuário (vendedor)', required: false, example: 'clx000000000000000000000' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Número da página para paginação', required: false, default: 1, example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Número de itens por página para paginação', required: false, default: 10, example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
