import { Client } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class ClientEntity implements Client {
  @ApiProperty({ description: 'ID do cliente', example: 'clx0000000000000000000000' })
  id: string;

  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  name: string;

  @ApiProperty({ description: 'Email do cliente', example: 'joao.silva@example.com' })
  email: string;

  @ApiProperty({ description: 'Telefone do cliente', example: '11987654321', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'CNPJ ou CPF do cliente', example: '123.456.789-00', nullable: true })
  cnpjCpf: string | null;

  @ApiProperty({ description: 'Endereço do cliente', example: 'Rua Exemplo, 123', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Data de criação do cliente', example: '2025-08-16T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do cliente', example: '2025-08-16T12:00:00.000Z' })
  updatedAt: Date;
}
