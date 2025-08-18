import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindDeletedProposalsDto {
  @ApiProperty({ description: 'Filtrar por título da proposta (não sensível a maiúsculas/minúsculas, correspondência parcial)', required: false })
  @IsString()
  @IsOptional()
  title?: string;

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
