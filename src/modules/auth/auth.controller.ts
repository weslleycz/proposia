import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtRefreshAuthGuard } from 'src/common/guards';
import type { RequestWithUser } from 'src/common/interfaces';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Realiza login do usuário e retorna tokens' })
  @ApiResponse({
    status: 201,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Renova tokens usando refresh token',
    description:
      'É necessário enviar o refresh token no header Authorization no formato: Bearer <refreshToken>',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Tokens renovados com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Req() req: RequestWithUser): Promise<LoginResponseDto> {
    return this.authService.refreshTokens(req.user.userId, req.user.email);
  }
}
