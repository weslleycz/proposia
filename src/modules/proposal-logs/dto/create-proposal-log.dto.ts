import { ProposalAction } from '@prisma/client';
import { IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProposalLogDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  changedById: string;

  @IsEnum(ProposalAction)
  @IsNotEmpty()
  action: ProposalAction;

  @IsJSON()
  @IsOptional()
  oldData?: any;

  @IsJSON()
  @IsOptional()
  newData?: any;
}
