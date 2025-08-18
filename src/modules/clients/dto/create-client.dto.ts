import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Telefone do cliente (opcional)',
    example: '11987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'CNPJ ou CPF do cliente (opcional)',
    example: '123.456.789-00',
    required: false,
  })
  @IsString()
  @IsOptional()
  cnpjCpf?: string;

  @ApiProperty({
    description: 'Endereço do cliente (opcional)',
    example: 'Rua Exemplo, 123',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;
}
