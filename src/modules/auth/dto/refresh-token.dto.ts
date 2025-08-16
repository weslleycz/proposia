import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token JWT', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refreshToken: string;
}
