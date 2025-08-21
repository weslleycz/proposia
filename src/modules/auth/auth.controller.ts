import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtRefreshAuthGuard } from 'src/common/guards';
import type { RequestWithUser } from 'src/common/interfaces';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  ResetPasswordDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Realiza login do usuário e retorna tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() data: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(data);
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

  @Post('forgot-password')
  @ApiOperation({ summary: 'Envia email para resetar a senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Email enviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reseta a senha do usuário' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() data: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(data.token, data.newPassword);
  }
}
