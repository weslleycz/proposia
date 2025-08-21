import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acesso (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de atualização (Refresh Token)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Informações do usuário',
    type: Object,
    example: {
      id: '123456',
      email: 'usuario@exemplo.com',
    },
  })
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
