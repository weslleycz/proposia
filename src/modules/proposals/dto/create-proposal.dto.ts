import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ProposalStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProposalDto {
  @ApiProperty({ description: 'O título da proposta', example: 'Redesenho do Website' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'A descrição da proposta', required: false, example: 'Redesenho do website da empresa para melhorar a UX.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'O valor total da proposta', example: 15000 })
  @IsInt()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ description: 'O status da proposta', enum: ProposalStatus, default: ProposalStatus.DRAFT, required: false })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiProperty({ description: 'O ID do cliente associado à proposta', example: 'clx000000000000000000000' })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}
