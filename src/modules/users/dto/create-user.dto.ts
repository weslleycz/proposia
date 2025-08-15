import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'O nome do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'O email do usuário' })
  @IsEmail({}, { message: 'O e-mail fornecido não é válido.' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'A senha do usuário' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

}