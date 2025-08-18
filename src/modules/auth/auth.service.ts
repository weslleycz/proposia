import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getAuthConfig } from 'src/common/config';
import { JwtPayload } from 'src/common/interfaces';
import {
  BcryptService,
  PrismaService,
  SendMailService,
} from 'src/common/services';
import { LoginResponseDto } from './dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bcryptService: BcryptService,
    private readonly sendMailService: SendMailService,
  ) {}

  private get userRepository() {
    return this.prismaService.user;
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userRepository.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const authConfig = getAuthConfig(this.configService);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtSecret,
      expiresIn: authConfig.jwtExpiration,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtRefreshSecret,
      expiresIn: authConfig.jwtRefreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async refreshTokens(
    userId: string,
    email: string,
  ): Promise<LoginResponseDto> {
    const authConfig = getAuthConfig(this.configService);
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtSecret,
      expiresIn: authConfig.jwtExpiration,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtRefreshSecret,
      expiresIn: authConfig.jwtRefreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const authConfig = getAuthConfig(this.configService);
    const payload = { sub: user.id };

    const token = await this.jwtService.signAsync(payload, {
      secret: authConfig.jwtPasswordResetSecret,
      expiresIn: authConfig.jwtPasswordResetExpiration,
    });

    await this.sendMailService.send({
      to: user.email,
      subject: 'Redefinição de Senha',
      template: 'reset-password.pug',
      parametros: {
        name: user.name,
        token,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const authConfig = getAuthConfig(this.configService);

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: authConfig.jwtPasswordResetSecret,
      });

      const passwordHash = await this.bcryptService.hashPassword(newPassword);

      await this.userRepository.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });
    } catch (error) {
      throw new BadRequestException('Token inválido ou expirado');
    }
  }
}
