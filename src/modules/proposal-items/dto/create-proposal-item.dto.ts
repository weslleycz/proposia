import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProposalItemDto {
  @ApiProperty({ description: 'Descrição do item da proposta' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantidade do item', example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Preço unitário do item', example: 10000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
