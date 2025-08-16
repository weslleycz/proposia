import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptService, PrismaService } from 'src/common/services';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { getAuthConfig } from 'src/common/config';
import { JwtPayload } from 'src/common/interfaces';
import { LoginResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly bcryptService: BcryptService,
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
}
