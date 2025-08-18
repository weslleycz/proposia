import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário para qual o email de reset será enviado',
    example: 'john.doe@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
