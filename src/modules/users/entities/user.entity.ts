import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserEntity {
  @ApiProperty({
    description: 'O ID único do usuário',
    example: 'clxvf9s2f0000u08j4q3b5e7k',
  })
  id: string;

  @ApiProperty({
    description: 'O nome do usuário',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'O endereço de e-mail do usuário',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'O cargo do usuário',
    enum: Role,
    example: Role.SALESPERSON,
  })
  role: Role;

  @ApiProperty({
    description: 'A data e hora em que o usuário foi criado',
    example: '2025-08-15T21:43:20.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'A data e hora em que o usuário foi atualizado pela última vez',
    example: '2025-08-15T21:43:20.000Z',
  })
  updatedAt: Date;
}
